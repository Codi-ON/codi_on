package com.team.backend.service;

import com.team.backend.api.dto.weather.DailyWeatherDto;
import com.team.backend.api.dto.weather.OpenWeatherForecastDto;
import com.team.backend.api.dto.weather.WeeklyWeatherDto;
import com.team.backend.domain.DailyWeather;
import com.team.backend.repository.DailyWeatherRepository;
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
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WeatherService {

    // ✅ .env 를 통해 주입받는 Dotenv
    private final Dotenv dotenv;

    private final RestTemplate restTemplate;
    private final DailyWeatherRepository dailyWeatherRepository;

    // ✅ URL 은 application.yml 에서
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
    // 1) 외부 API 호출 + DB 저장
    // ==============================

    /**
     * forecast 5일 데이터를 불러와서
     * 오늘 기준 하루치로 집계 후 저장 + 반환
     */
    public DailyWeatherDto getTodayWeather(double lat, double lon, String region) {
        OpenWeatherForecastDto forecast = callOpenWeatherForecast(lat, lon);

        // forecast.list → 날짜별 하루 데이터로 변환 (최대 5일)
        List<DailyWeather> dailyList = toDailyEntities(region, forecast, 5);

        if (dailyList.isEmpty()) {
            throw new IllegalStateException("forecast 에서 일별 데이터를 만들 수 없습니다.");
        }

        DailyWeather todayEntity = dailyList.get(0); // 첫 번째 날짜 = 오늘에 가장 가까운 날짜

        LocalDate date = todayEntity.getDate();
        dailyWeatherRepository.deleteByRegionAndDateBetween(region, date, date);
        dailyWeatherRepository.save(todayEntity);

        return DailyWeatherDto.from(todayEntity);
    }

    /**
     * 5일치 forecast → 일별로 집계해서 DB에 저장 + Weekly DTO 반환
     */
    @CacheEvict(value = "weeklyWeather", key = "#region")
    public WeeklyWeatherDto getWeeklyWeather(double lat, double lon, String region) {
        OpenWeatherForecastDto forecast = callOpenWeatherForecast(lat, lon);

        List<DailyWeather> entities = toDailyEntities(region, forecast, 5);

        if (entities.isEmpty()) {
            throw new IllegalStateException("OpenWeather forecast 에서 일별 데이터를 만들 수 없습니다.");
        }

        LocalDate start = entities.stream()
                .map(DailyWeather::getDate)
                .min(Comparator.naturalOrder())
                .orElseThrow();

        LocalDate end = entities.stream()
                .map(DailyWeather::getDate)
                .max(Comparator.naturalOrder())
                .orElseThrow();

        dailyWeatherRepository.deleteByRegionAndDateBetween(region, start, end);
        dailyWeatherRepository.saveAll(entities);

        return WeeklyWeatherDto.from(region, entities);
    }

    /**
     * DB에 기간 데이터가 있으면 그걸 쓰고,
     * 없으면 forecast 호출 후 저장
     */
    @Cacheable(value = "weeklyWeather", key = "#region")
    @Transactional(readOnly = true)
    public WeeklyWeatherDto fetchWeeklyIfNeeded(double lat, double lon, String region) {
        LocalDate today = LocalDate.now();
        LocalDate end = today.plusDays(4); // 5일

        List<DailyWeather> between =
                dailyWeatherRepository.findByRegionAndDateBetweenOrderByDateAsc(region, today, end);

        if (!between.isEmpty()) {
            log.info("✅ 주간 날씨 데이터가 이미 DB에 존재합니다. region={}, 기간={} ~ {}", region, today, end);
            return WeeklyWeatherDto.from(region, between);
        }

        log.info("⚠️ 주간 날씨 데이터가 DB에 없어 OpenWeather forecast 를 호출합니다. region={}, 기간={} ~ {}", region, today, end);
        // 여기서는 @CacheEvict 걸린 getWeeklyWeather 를 사용
        return getWeeklyWeather(lat, lon, region);
    }

    // ==============================
    // 2) DB 조회 (프론트에서 사용하는 실제 API)
    // ==============================

    @Transactional(readOnly = true)
    public DailyWeatherDto getTodayWeatherFromDb(String region) {
        LocalDate today = LocalDate.now();

        List<DailyWeather> todayList =
                dailyWeatherRepository.findByRegionAndDateOrderByIdDesc(region, today);

        DailyWeather entity;

        if (!todayList.isEmpty()) {
            entity = todayList.get(0);
        } else {
            log.warn("오늘({}) 데이터가 없어 최근 데이터로 대체합니다. region={}", today, region);

            entity = dailyWeatherRepository.findTopByRegionOrderByDateDesc(region)
                    .orElseThrow(() ->
                            new EntityNotFoundException("해당 지역(" + region + ")의 날씨 데이터가 없습니다.")
                    );
        }

        return DailyWeatherDto.from(entity);
    }

    @Transactional(readOnly = true)
    public WeeklyWeatherDto getWeeklyWeatherFromDb(String region) {
        LocalDate today = LocalDate.now();
        LocalDate end = today.plusDays(4); // 5일

        List<DailyWeather> between =
                dailyWeatherRepository.findByRegionAndDateBetweenOrderByDateAsc(region, today, end);

        if (between.isEmpty()) {
            throw new EntityNotFoundException(
                    "주간 날씨 데이터가 없습니다. (region=" + region + ", 기간=" + today + " ~ " + end + ")"
            );
        }

        return WeeklyWeatherDto.from(region, between);
    }

    // ==============================
    // 3) OpenWeather 호출 + 변환
    // ==============================

    private OpenWeatherForecastDto callOpenWeatherForecast(double lat, double lon) {
        long start = System.currentTimeMillis();

        try {
            URI uri = UriComponentsBuilder
                    .fromHttpUrl(weatherApiUrl)   // e.g. https://api.openweathermap.org/data/2.5/forecast
                    .queryParam("lat", lat)
                    .queryParam("lon", lon)
                    .queryParam("appid", getApiKey())   // ✅ .env 에서 읽은 키 사용
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
    // 4) forecast.list → DailyWeather 리스트로 집계
    // ==============================

    private List<DailyWeather> toDailyEntities(String region,
                                               OpenWeatherForecastDto forecast,
                                               int maxDays) {

        // 1) dt(초) → LocalDate 로 묶기
        Map<LocalDate, List<OpenWeatherForecastDto.ForecastItem>> byDate =
                forecast.getList().stream()
                        .collect(Collectors.groupingBy(
                                item -> Instant.ofEpochSecond(item.getDt())
                                        .atZone(ZoneId.systemDefault())
                                        .toLocalDate(),
                                LinkedHashMap::new,
                                Collectors.toList()
                        ));

        // 2) 날짜별로 집계해서 DailyWeather 로 변환
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
                .mapToDouble(OpenWeatherForecastDto.Main::getTemp)
                .average()
                .orElse(0.0);

        // 최저/최고 기온
        double minTemp = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .mapToDouble(OpenWeatherForecastDto.Main::getTempMin)
                .min()
                .orElse(avgTemp);

        double maxTemp = items.stream()
                .map(OpenWeatherForecastDto.ForecastItem::getMain)
                .mapToDouble(OpenWeatherForecastDto.Main::getTempMax)
                .max()
                .orElse(avgTemp);

        // 평균 습도
        int humidity = (int) Math.round(
                items.stream()
                        .map(OpenWeatherForecastDto.ForecastItem::getMain)
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

        // 강수 확률: 해당 날짜 예보 중 pop 최대값
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
                .orElse(null);

        return DailyWeather.builder()
                .region(region)
                .date(date)
                .temperature(avgTemp)
                .minTemperature(minTemp)
                .maxTemperature(maxTemp)
                .sky(sky)
                .precipitationProbability(precipitationProbability)
                .humidity(humidity)
                .windSpeed(windSpeed)
                .build();
    }

    // ==============================
    // 5) 스마트 오늘 조회
    // ==============================

    public DailyWeatherDto getTodaySmart(double lat, double lon, String region) {
        LocalDate today = LocalDate.now();

        List<DailyWeather> todayList =
                dailyWeatherRepository.findByRegionAndDateOrderByIdDesc(region, today);

        if (!todayList.isEmpty()) {
            return DailyWeatherDto.from(todayList.get(0));
        }

        log.info("⚠️ 오늘({}) {} 데이터가 없어 주간 날씨를 새로 가져옵니다.", today, region);

        getWeeklyWeather(lat, lon, region);

        todayList =
                dailyWeatherRepository.findByRegionAndDateOrderByIdDesc(region, today);

        if (!todayList.isEmpty()) {
            return DailyWeatherDto.from(todayList.get(0));
        }

        log.warn("❗ 주간 날씨를 새로 저장했는데도 오늘({}) 데이터가 없어 최근 데이터로 대체합니다. region={}", today, region);
        return getTodayWeatherFromDb(region);
    }
}