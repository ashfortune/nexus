package com.team.nexus.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "Health Check", description = "서버 상태 확인용 API")
@RestController
public class HealthController {

    @Operation(summary = "Spring Boot 헬스체크", description = "서버가 정상 작동 중인지 확인합니다.")
    @GetMapping("/health")
    public Map<String, Object> healthCheck() {
        return Map.of(
            "status", "ok",
            "service", "spring-boot"
        );
    }
}
