package com.team.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // CSRF 일단 개발 중에는 끔
                .csrf(csrf -> csrf.disable())
                // H2 콘솔이 iframe 안에서 열려서 막히지 않도록
                .headers(headers ->
                        headers.frameOptions(frameOptions -> frameOptions.disable())
                )
                .authorizeHttpRequests(auth -> auth
                        // H2 콘솔 & Swagger는 전체 허용
                        .requestMatchers(
                                "/h2-console/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()
                        // 나머지도 일단 전부 허용 (개발 단계)
                        .anyRequest().permitAll()
                )
                // 굳이 로그인 페이지 필요 없으면 다음 줄도 주석 가능
                .formLogin(Customizer.withDefaults());

        return http.build();
    }
}