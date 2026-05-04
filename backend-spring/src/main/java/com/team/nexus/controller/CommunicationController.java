package com.team.nexus.controller;

import com.team.nexus.client.FastApiClient;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Map;

@Tag(name = "Inter-Server Communication", description = "다른 서버(FastAPI 등)와 통신하는 API")
@RestController
@RequestMapping("/api/v1/comm")
public class CommunicationController {

    private final FastApiClient fastApiClient;

    public CommunicationController(FastApiClient fastApiClient) {
        this.fastApiClient = fastApiClient;
    }

    @Operation(summary = "FastAPI 서버 호출 테스트", description = "Spring Boot에서 FastAPI의 헬스체크 API를 호출합니다.")
    @GetMapping("/call-fastapi")
    public Mono<Map> callFastApi() {
        return fastApiClient.getFastApiHealth();
    }

    @Operation(summary = "FastAPI 서버로 메시지 전송", description = "FastAPI 서버로 데이터를 전송하고 응답을 받습니다.")
    @PostMapping("/send-to-fastapi")
    public Mono<Map> sendToFastApi(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "Hello from Spring Boot");
        return fastApiClient.sendToFastApi(message);
    }
}
