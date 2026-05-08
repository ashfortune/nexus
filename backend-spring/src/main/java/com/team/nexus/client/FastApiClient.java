package com.team.nexus.client;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class FastApiClient {

    private final WebClient webClient;

    public FastApiClient(WebClient.Builder webClientBuilder, 
                         @org.springframework.beans.factory.annotation.Value("${fastapi.url:http://localhost:8000}") String fastApiUrl) {
        this.webClient = webClientBuilder.baseUrl(fastApiUrl).build();
    }

    /**
     * FastAPI 서버의 헬스체크 API를 호출
     */
    public Mono<Map> getFastApiHealth() {
        return this.webClient.get()
                .uri("/health")
                .retrieve()
                .bodyToMono(Map.class);
    }

    /**
     * FastAPI 서버로 메시지를 전송
     */
    public Mono<Map> sendToFastApi(String message) {
        return this.webClient.post()
                .uri("/receive-from-spring")
                .bodyValue(Map.of(
                    "message", message,
                    "sender", "Spring Boot"
                ))
                .retrieve()
                .bodyToMono(Map.class);
    }

    /**
     * FastAPI 서버에 매출 데이터 분석 및 예측 실행 요청
     * @param userId 사용자 ID
     * @return 분석 결과 (JSON)
     */
    public Mono<Map> triggerSalesAnalysis(String userId) {
        return this.webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/v1/ai/prediction/analysis")
                        .queryParam("userId", userId)
                        .build())
                .retrieve()
                .bodyToMono(Map.class);
    }

}
