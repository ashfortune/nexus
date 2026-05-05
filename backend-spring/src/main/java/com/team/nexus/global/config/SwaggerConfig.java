package com.team.nexus.global.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI springShopOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("Spring Boot Team Project API")
                        .description("팀 프로젝트를 위한 Spring Boot 기반 서버입니다. Swagger UI를 활용하여 API를 편리하게 확인하세요.")
                        .version("v1.0.0"));
    }
}
