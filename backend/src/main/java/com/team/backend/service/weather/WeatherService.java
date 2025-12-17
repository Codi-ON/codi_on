// src/main/java/com/team/backend/service/weather/WeatherService.java
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
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WeatherService {

    private static final int DEFAULT_DAYS = 5;
    private static final ZoneId KST_ZONE = ZoneId.of("Asia/Seoul");

    private final Dotenv dotenv;
    private final RestTemplate restTemplate;
    private final DailyWeatherRepository dailyWeatherRepository;
    private final OpenWeatherDailyAggregator aggregator;

    @Value("${weather.api.url}")
    private String weatherApiUrl;
    // ==============================
    // 컨트롤러가 쓰는 public 4개
    // ==============================

    /**
     * (1) 오늘 날씨: DB 우선, 없으면 weekly fetch로 채움
     * - 내부에서 저장(upsert)까지 발생할 수 있으므로 readOnly 금지
     */
    public DailyWeatherResponseDto getTodaySmart(double lat, double lon, String region) {
        LocalDate today = LocalDate.now(KST_ZONE);

        Optional<DailyWeather> todayOpt = dailyWeatherRepository.findByRegionAndDate(region, today);
        if (todayOpt.isPresent()) {
            return DailyWeatherResponseDto.from(todayOpt.get());
        }

        log.info("⚠️ today({}) 데이터 없음 → weekly fetch 시도. region={}", today, region);
        fetchWeeklyIfNeeded(lat, lon, region);

        return dailyWeatherRepository.findByRegionAndDate(region, today)
                .map(DailyWeatherResponseDto::from)
                .orElseGet(() -> {
                    log.warn("❗ fetch 후에도 today({}) 없음 → 최근 데이터로 대체. region={}", today, region);
                    return getLatestFromDb(region);
                });
    }

    /**
     * (2) 주간 조회: DB 기준 (read-only)
     */
    @Transactional(readOnly = true)
    public WeeklyWeatherResponseDto getWeeklyWeatherFromDb(String region) {
        LocalDate today = LocalDate.now(KST_ZONE);
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

    /**
     * (3) 주간 fetch(필요 시): DB 부족하면 외부 호출 + 저장
     */
    @Cacheable(value = "weeklyWeather", key = "#region")
    public WeeklyWeatherResponseDto fetchWeeklyIfNeeded(double lat, double lon, String region) {
        LocalDate today = LocalDate.now(KST_ZONE);
        LocalDate end = today.plusDays(DEFAULT_DAYS - 1);

        long count = dailyWeatherRepository.countByRegionAndDateBetween(region, today, end);
        if (count >= DEFAULT_DAYS) {
            log.info("✅ weekly DB 충분. region={}, {}~{}", region, today, end);
            return getWeeklyWeatherFromDb(region);
        }

        log.info("⚠️ weekly DB 부족 → OpenWeather 호출. region={}, {}~{}", region, today, end);
        return getWeeklyWeather(lat, lon, region); // cache evict
    }

    /**
     * (4) 주간 force fetch: 무조건 외부 호출 + upsert
     */
    @CacheEvict(value = "weeklyWeather", key = "#region")
    public WeeklyWeatherResponseDto getWeeklyWeather(double lat, double lon, String region) {
        OpenWeatherForecastDto forecast = callOpenWeatherForecast(lat, lon);

        List<DailyWeather> entities = aggregator.aggregate(region, forecast, DEFAULT_DAYS);
        if (entities.isEmpty()) {
            throw new IllegalStateException("OpenWeather forecast에서 일별 데이터를 만들 수 없습니다.");
        }

        upsertDailyWeathers(entities);
        return getWeeklyWeatherFromDb(region);
    }

    // ==============================
    // private helpers
    // ==============================

    private String getApiKey() {
        String key = dotenv.get("OPENWEATHER_API_KEY");
        if (key == null || key.isBlank()) {
            log.error("❌ .env 에 OPENWEATHER_API_KEY 가 설정되지 않았습니다.");
            throw new IllegalStateException("OPENWEATHER_API_KEY 가 .env 에 없습니다.");
        }
        return key;
    }

    @Transactional(readOnly = true)
    protected DailyWeatherResponseDto getLatestFromDb(String region) {
        DailyWeather entity = dailyWeatherRepository.findTopByRegionOrderByDateDesc(region)
                .orElseThrow(() -> new EntityNotFoundException("해당 지역(" + region + ")의 날씨 데이터가 없습니다."));
        return DailyWeatherResponseDto.from(entity);
    }

    private OpenWeatherForecastDto callOpenWeatherForecast(double lat, double lon) {
        long start = System.currentTimeMillis();

        try {
            URI uri = UriComponentsBuilder
                    .fromHttpUrl(weatherApiUrl)
                    .queryParam("lat", lat)
                    .queryParam("lon", lon)
                    .queryParam("appid", getApiKey())
                    .queryParam("units", "metric")
                    .build()
                    .toUri();

            log.info("🔎 Calling OpenWeather forecast API: {}", uri);

            OpenWeatherForecastDto response =
                    restTemplate.getForObject(uri, OpenWeatherForecastDto.class);

            long elapsed = System.currentTimeMillis() - start;
            log.info("✅ OpenWeather 응답 시간 = {} ms", elapsed);

            if (response == null || response.getList() == null || response.getList().isEmpty()) {
                throw new IllegalStateException("OpenWeather forecast API에서 데이터를 가져오지 못했습니다.");
            }
            if (!"200".equals(response.getCod())) {
                throw new IllegalStateException("OpenWeather forecast API 에러 (cod=" + response.getCod() + ")");
            }

            return response;
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            log.error("❌ OpenWeather 호출 실패 ({} ms)", elapsed, e);
            throw e;
        }
    }

    private void upsertDailyWeathers(List<DailyWeather> incomingList) {
    if (incomingList == null || incomingList.isEmpty()) return;

    // 같은 region으로 들어온다는 전제(너 컨트롤러/서비스 흐름상 맞음)
    String region = incomingList.get(0).getRegion();

    // 들어온 날짜 범위(min~max) 계산
    LocalDate minDate = incomingList.stream()
            .map(DailyWeather::getDate)
            .min(LocalDate::compareTo)
            .orElseThrow();

    LocalDate maxDate = incomingList.stream()
            .map(DailyWeather::getDate)
            .max(LocalDate::compareTo)
            .orElseThrow();

    LocalDateTime now = LocalDateTime.now(KST_ZONE);

    // ✅ 1) 기존 데이터 한 번에 조회
    List<DailyWeather> existing = dailyWeatherRepository
            .findAllByRegionAndDateBetweenOrderByDateAsc(region, minDate, maxDate);

    // ✅ 2) (date -> entity) Map 생성
    var existingMap = existing.stream()
            .collect(java.util.stream.Collectors.toMap(DailyWeather::getDate, e -> e));

    // ✅ 3) incoming을 기준으로 upsert 대상 리스트 구성
    List<DailyWeather> toSave = new java.util.ArrayList<>(incomingList.size());

    for (DailyWeather incoming : incomingList) {
        LocalDate date = incoming.getDate();

        DailyWeather entity = existingMap.get(date);
        if (entity == null) {
            // 신규 insert
            DailyWeather created = DailyWeather.builder()
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
                    .build();
            toSave.add(created);
        } else {
            // 기존 update
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
            toSave.add(entity);
        }
    }

    // ✅ 4) saveAll 한 번
    dailyWeatherRepository.saveAll(toSave);
}
}
