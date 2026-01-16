# ---- build ----
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

RUN chmod +x gradlew
RUN ./gradlew --no-daemon dependencies || true

COPY src ./src

RUN ./gradlew clean build -x test --no-daemon

# ✅ 여러 jar 중 plain 제외하고 1개만 app.jar로 고정
RUN set -e; \
    JAR="$(ls -1 build/libs/*.jar | grep -v plain | head -n 1)"; \
    echo "Selected jar: $JAR"; \
    cp "$JAR" /app/app.jar

# ---- runtime ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]