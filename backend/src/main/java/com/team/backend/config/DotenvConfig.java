// src/main/java/com/team/backend/config/DotenvConfig.java
package com.team.backend.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DotenvConfig {

    @Bean
    public Dotenv dotenv() {
        /**
         * 핵심 포인트
         * - dotenv-java는 "현재 working directory" 기준으로 찾는다.
         * - IDE/Gradle/Docker마다 working directory가 달라서 directory("./")에 의존하면 흔들린다.
         * - 가장 안정적인 방식: 기본 탐색(working dir) + 없으면 무시 + system env 우선
         */
        return Dotenv.configure()
                .ignoreIfMissing()     // .env 없으면 런타임 에러 내지 않음(운영/도커에서 필수)
                .systemProperties()    // -DKEY=VALUE 형태 허용(선택)
                .load();
    }
}