package com.team.backend.service.weather;

import com.team.backend.api.dto.weather.DailyWeatherResponseDto;
import com.team.backend.api.dto.weather.OpenWeatherForecastDto;
import com.team.backend.api.dto.weather.WeeklyWeatherResponseDto;
import com.team.backend.domain.DailyWeather;
import com.team.backend.repository.weather.DailyWeatherRepository;
import io.github.cdimascio.dotenv.Dotenv;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.*;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WeatherService {

    private static final int DEFAULT_DAYS = 5;

    private final Dotenv dotenv;
    private final RestTemplate restTemplate;
    private final DailyWeatherRepository dailyWeatherRepository;

    @Value("${weather.api.url}")
    private String weatherApiUrl;

    // ==============================
    // 0) .env 에서 API KEY 가져오기
    // ==============================
    private String getApiKey() {
        String key = dotenv.get("OPENWEATHER_API_KEY");
        if (key == null || key.isBlank()) {
            log.error("❌ .env 에 OPENWEATHER_API_KEY 가 설정되지 않았습니다.");
            throw new IllegalStateException("OPENWEATHER_API_KEY 가 .env 에 없습니다.");
        }
        return key;
    }

    // ==============================
    // 1) 프론트에서 쓰는 API용 (DB 기반)
    // ==============================

    @Transactional(readOnly = true)
    public DailyWeatherResponseDto getTodayWeatherFromDb(String region) {
        LocalDate today = LocalDate.now();

        DailyWeather entity = dailyWeatherRepository.findByRegionAndDate(region, today)
                .orElseGet(() -> {
                    log.warn("오늘({}) 데이터가 없어 최근 데이터로 대체합니다. region={}", today, region);
                    return dailyWeatherRepository.findTopByRegionOrderByDateDesc(region)
                            .orElseThrow(() -> new EntityNotFoundException("해당 지역(" + region + ")의 날씨 데이터가 없습니다."));
                });

        return DailyWeatherResponseDto.from(entity);
    }

    @Transactional(readOnly = true)
    public WeeklyWeatherResponseDto getWeeklyWeatherFromDb(String region) {
        LocalDate today = LocalDate.now();
        LocalDate end = today.plusDays(DEFAULT_DAYS - 1);

        List<DailyWeather> between =
                dailyWeatherRepository.findAllByRegionAndDateBetweenOrderByDateAsc(region, today, end);

        if (between.isEmpty()) {
            throw new EntityNotFoundException(
                    "주간 날씨 데이터가 없습니다. (region=" + region + ", 기간=" + today + " ~ " + end + ")"
            );
        }

        List<DailyWeatherResponseDto> days = between.stream()
                .map(DailyWeatherResponseDto::from)
                .toList();

        return WeeklyWeatherResponseDto.of(region, days);
    }

    // ==============================
    // 2) 스마트 오늘 조회 (DB 우선, 없으면 fetch로 채움)
    // ==============================

    public DailyWeatherResponseDto getTodaySmart(double lat, double lon, String region) {
        LocalDate today = LocalDate.now();

        Optional<DailyWeather> todayOpt = dailyWeatherRepository.findByRegionAndDate(region, today);
        if (todayOpt.isPresent()) {
            return DailyWeatherResponseDto.from(todayOpt.get());
        }

        log.info("⚠️ 오늘({}) {} 데이터가 없어 주간 날씨를 새로 가져옵니다.", today, region);
        fetchWeeklyIfNeeded(lat, lon, region);

        return dailyWeatherRepository.findByRegionAndDate(region, today)
                .map(DailyWeatherResponseDto::from)
                .orElseGet(() -> {
                    log.warn("❗ 주간 날씨를 저장했는데도 오늘({}) 데이터가 없어 최근 데이터로 대체합니다. region={}", today, region);
                    return getTodayWeatherFromDb(region);
                });
    }

    // ==============================
    // 3) 주간 날씨 fetch (DB에 없으면 외부 호출 + 저장)
    // ==============================

    @Cacheable(value = "weeklyWeather", key = "#region")
    public WeeklyWeatherResponseDto fetchWeeklyIfNeeded(double lat, double lon, String region) {
        LocalDate today = LocalDate.now();
        LocalDate end = today.plusDays(DEFAULT_DAYS - 1);

        long count = dailyWeatherRepository.countByRegionAndDateBetween(region, today, end);
        if (count >= DEFAULT_DAYS) {
            log.info("✅ 주간 날씨 데이터가 이미 DB에 존재합니다. region={}, 기간={} ~ {}", region, today, end);
            return getWeeklyWeatherFromDb(region);
        }

        log.info("⚠️ 주간 날씨 데이터가 부족하여 OpenWeather forecast 를 호출합니다. region={}, 기간={} ~ {}", region, today, end);
        // 아래 메서드는 @CacheEvict로 캐시를 비움
        return getWeeklyWeather(lat, lon, region);
    }

    // ==============================
    // 4) 주간 날씨 강제 fetch (무조건 외부 호출 + upsert)
    // ==============================

    @CacheEvict(value = "weeklyWeather", key = "#region")
    public WeeklyWeatherResponseDto getWeeklyWeather(double lat, double lon, String region) {
        OpenWeatherForecastDto forecast = callOpenWeatherForecast(lat, lon);

        List<DailyWeather> entities = toDailyEntities(region, forecast, DEFAULT_DAYS);
        if (entities.isEmpty()) {
            throw new IllegalStateException("OpenWeather forecast 에서 일별 데이터를 만들 수 없습니다.");
        }

        upsertDailyWeathers(entities);

        // DB에서 다시 읽어서 정렬/일관성 보장
        return getWeeklyWeatherFromDb(region);
    }

    // ==============================
    // 5) 필요시: 오늘만 외부 호출해서 갱신하고 싶을 때
    // ==============================

    public DailyWeatherResponseDto getTodayWeather(double lat, double lon, String region) {
        OpenWeatherForecastDto forecast = callOpenWeatherForecast(lat, lon);

        List<DailyWeather> dailyList = toDailyEntities(region, forecast, DEFAULT_DAYS);
        if (dailyList.isEmpty()) {
            throw new IllegalStateException("forecast 에서 일별 데이터를 만들 수 없습니다.");
        }

        DailyWeather todayEntity = dailyList.get(0);
        upsertDailyWeathers(List.of(todayEntity));

        return dailyWeatherRepository.findByRegionAndDate(region, todayEntity.getDate())
                .map(DailyWeatherResponseDto::from)
                .orElseThrow(() -> new IllegalStateException("오늘 날씨 upsert 후 조회에 실패했습니다."));
    }

    // ==============================
    // 6) OpenWeather 호출
    // ==============================

    private OpenWeatherForecastDto callOpenWeatherForecast(double lat, double lon) {
        long start = System.currentTimeMillis();

        try {
            URI uri = UriComponentsBuilder
                    .fromHttpUrl(weatherApiUrl)   // e.g. https://api.openweathermap.org/data/2.5/forecast
                    .queryParam("lat", lat)
                    .queryParam("lon", lon)
                    .queryParam("appid", getApiKey())
                    .queryParam("units", "metric")
                    .build()
                    .toUri();

            log.info("🔎 Calling OpenWeather 5-day/3h forecast API: {}", uri);

            OpenWeatherForecastDto response =
                    restTemplate.getForObject(uri, OpenWeatherForecastDto.class);

            long elapsed = System.currentTimeMillis() - start;
            log.info("✅ OpenWeather 응답 시간 = {} ms", elapsed);

            if (response == null || response.getList() == null || response.getList().isEmpty()) {
                log.error("❌ OpenWeather forecast 응답에 list 데이터가 없습니다. response = {}", response);
                throw new IllegalStateException("OpenWeather forecast API에서 데이터를 가져오지 못했습니다.");
            }

            if (!"200".equals(response.getCod())) {
                log.error("❌ OpenWeather forecast 응답 cod != 200 : response = {}", response);
                throw new IllegalStateException("OpenWeather forecast API 에러 (cod=" + response.getCod() + ")");
            }

            return response;
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            log.error("❌ OpenWeather 호출 실패 ({} ms)", elapsed, e);
            throw e;
        }
    }

    // ==============================
    // 7) forecast.list → 날짜별 DailyWeather 집계
    // ==============================

    private List<DailyWeather> toDailyEntities(String region,
                                               OpenWeatherForecastDto forecast,
                                               int maxDays) {

        Map<LocalDate, List<OpenWeatherForecastDto.ForecastItem>> byDate =
                forecast.getList().stream()
                        .collect(Collectors.groupingBy(
                                item -> Instant.ofEpochSecond(item.getDt())
                                        .atZone(ZoneId.systemDefault())
                                        .toLocalDate(),
                                LinkedHashMap::new,
                                Collectors.toList()
                        ));

        return byDate.entrySet().stream()
                .limit(maxDays)
                .map(entry -> aggregateDay(region, entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    private DailyWeather aggregateDay(String region,
                                      LocalDate date,
                                      List<OpenWeatherForecastDto.ForecastItem> items) {

        // 평균 기온
        double avgTemp = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .filter(Objects::nonNull)
                .mapToDouble(OpenWeatherForecastDto.Main::getTemp)
                .average()
                .orElse(0.0);

        // 최저/최고 기온
        double minTemp = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .filter(Objects::nonNull)
                .mapToDouble(OpenWeatherForecastDto.Main::getTempMin)
                .min()
                .orElse(avgTemp);

        double maxTemp = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .filter(Objects::nonNull)
                .mapToDouble(OpenWeatherForecastDto.Main::getTempMax)
                .max()
                .orElse(avgTemp);

        // ✅ 체감온도 평균
        double feelsLikeAvg = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .filter(Objects::nonNull)
                .mapToDouble(OpenWeatherForecastDto.Main::getFeelsLike)
                .average()
                .orElse(avgTemp);

        // ✅ 구름양 평균(0~100)
        int cloudAvg = (int) Math.round(
                items.stream()
                        .map(OpenWeatherForecastDto.ForecastItem::getClouds)
                        .filter(Objects::nonNull)
                        .mapToInt(OpenWeatherForecastDto.Clouds::getAll)
                        .average()
                        .orElse(0.0)
        );

        // 평균 습도
        int humidity = (int) Math.round(
                items.stream()
                        .map(OpenWeatherForecastDto.ForecastItem::getMain)
                        .filter(Objects::nonNull)
                        .mapToInt(OpenWeatherForecastDto.Main::getHumidity)
                        .average()
                        .orElse(0.0)
        );

        // 평균 풍속
        double windSpeed = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getWind)
                .filter(Objects::nonNull)
                .mapToDouble(OpenWeatherForecastDto.Wind::getSpeed)
                .average()
                .orElse(0.0);

        // 강수 확률: 해당 날짜 예보 중 pop 최대값 (0~1 → 0~100)
        int precipitationProbability = (int) Math.round(
                items.stream()
                        .mapToDouble(OpenWeatherForecastDto.ForecastItem::getPop)
                        .max()
                        .orElse(0.0) * 100
        );

        // sky: 가장 많이 나온 weather.main
        String sky = items.stream()
                .flatMap(item -> {
                    List<OpenWeatherForecastDto.Weather> w = item.getWeather();
                    return w == null ? Stream.<OpenWeatherForecastDto.Weather>empty() : w.stream();
                })
                .map(OpenWeatherForecastDto.Weather::getMain)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("UNKNOWN"); // ✅ 엔티티 sky NOT NULL 보호

        return DailyWeather.builder()
                .region(region)
                .date(date)
                .temperature(avgTemp)
                .minTemperature(minTemp)
                .maxTemperature(maxTemp)
                .feelsLikeTemperature(feelsLikeAvg)
                .cloudAmount(cloudAvg)
                .sky(sky)
                .precipitationProbability(precipitationProbability)
                .humidity(humidity)
                .windSpeed(windSpeed)
                // fetchedAt은 upsert에서 세팅(일괄 동일시각)
                .build();
    }

    // ==============================
    // 8) (region, date) 기준 upsert
    // ==============================

    private void upsertDailyWeathers(List<DailyWeather> incomingList) {
        LocalDateTime now = LocalDateTime.now();

        for (DailyWeather incoming : incomingList) {
            String region = incoming.getRegion();
            LocalDate date = incoming.getDate();

            DailyWeather entity = dailyWeatherRepository.findByRegionAndDate(region, date)
                    .orElseGet(() -> DailyWeather.builder()
                            .region(region)
                            .date(date)
                            .temperature(incoming.getTemperature())
                            .minTemperature(incoming.getMinTemperature())
                            .maxTemperature(incoming.getMaxTemperature())
                            .feelsLikeTemperature(incoming.getFeelsLikeTemperature())
                            .cloudAmount(incoming.getCloudAmount())
                            .sky(incoming.getSky())
                            .precipitationProbability(incoming.getPrecipitationProbability())
                            .humidity(incoming.getHumidity())
                            .windSpeed(incoming.getWindSpeed())
                            .fetchedAt(now)
                            .build()
                    );

            // 이미 있으면 updateFrom으로 갱신
            if (entity.getId() != null) {
                entity.updateFrom(
                        incoming.getTemperature(),
                        incoming.getMinTemperature(),
                        incoming.getMaxTemperature(),
                        incoming.getFeelsLikeTemperature(),
                        incoming.getCloudAmount(),
                        incoming.getSky(),
                        incoming.getPrecipitationProbability(),
                        incoming.getHumidity(),
                        incoming.getWindSpeed(),
                        now
                );
            } else {
                // 신규 생성도 fetchedAt 보장 (Builder에 넣었지만 방어적으로)
                // (필요하면 여기서도 세팅 가능)
            }

            dailyWeatherRepository.save(entity);
        }
    }
}