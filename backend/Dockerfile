# 1단계: 빌드 환경
FROM gradle:8.5-jdk17 AS builder
WORKDIR /app

# 캐시 효율화를 위해 설정 파일 먼저 복사
COPY build.gradle settings.gradle ./
RUN gradle dependencies --no-daemon

# 소스 코드 복사 및 빌드
COPY . .
RUN gradle clean build -x test --no-daemon

# --------------------------------------------------------

# 2단계: 실행 환경 (이미지 변경함)
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

# 1단계에서 빌드한 jar 파일 복사
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]