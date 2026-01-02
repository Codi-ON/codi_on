FROM eclipse-temurin:17-jdk AS build
WORKDIR /app


# 1) gradle wrapper 먼저 복사
COPY gradlew ./
COPY gradle ./gradle
COPY settings.gradle* build.gradle* ./

RUN chmod +x gradlew

# 2) 의존성 캐시
RUN ./gradlew --no-daemon dependencies || true

# 3) 소스 복사 후 빌드
COPY src ./src
RUN ./gradlew clean build -x test --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /app

# 헬스체크를 위해 curl을 설치하고, 이미지 크기를 줄이기 위해 캐시는 바로 지웁니다.
RUN apt-get update && apt-get install -y python3 && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]