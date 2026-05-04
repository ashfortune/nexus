package com.team.nexus.global.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@Tag(name = "System Status", description = "서버 및 DB 상태 확인 API")
@RestController
@RequestMapping("/api/v1/status")
public class StatusController {

    private final DataSource dataSource;

    public StatusController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Operation(summary = "서버 상태 및 DB 연결 확인", description = "Spring Boot 서버가 실행 중인지와 DB 연결이 정상인지 확인합니다.")
    @GetMapping("/check")
    public Map<String, Object> checkStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("message", "Nexus Spring Boot Server is running.");
        
        try (Connection connection = dataSource.getConnection()) {
            status.put("database", "CONNECTED");
        } catch (Exception e) {
            status.put("database", "DISCONNECTED");
            status.put("db_error", e.getMessage());
        }
        
        return status;
    }
}
