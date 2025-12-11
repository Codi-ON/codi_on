package com.team.backend.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DotenvConfig {

    @Bean
    public Dotenv dotenv() {
        return Dotenv.configure()
                .directory("./")      // 프로젝트 루트 (build.gradle 있는 위치)
                .filename(".env")     // .env 파일 이름
                .ignoreIfMissing()    // 서버 환경에서 .env 없으면 그냥 무시
                .load();
    }
}