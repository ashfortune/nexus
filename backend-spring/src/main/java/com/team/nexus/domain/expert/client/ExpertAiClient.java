package com.team.nexus.domain.expert.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * 전문가 도메인 전용 AI 서비스 클라이언트
 */
@Component
public class ExpertAiClient {

    private final WebClient webClient;

    public ExpertAiClient(WebClient.Builder webClientBuilder,
            @Value("${fastapi.url:http://localhost:8000}") String fastApiUrl) {
        this.webClient = webClientBuilder.baseUrl(fastApiUrl).build();
    }

    /**
     * FastAPI 서버에 전문가 매칭 요청을 보냅니다.
     * 
     * @param categoryId     산업군 카테고리 ID
     * @param requestContent 사용자 요청 내용
     * @return 매칭 결과 (전문가 목록 및 추천 사유)
     */
    public Mono<Map> requestExpertMatch(java.util.UUID userId, java.util.UUID categoryId, String requestContent) {
        java.util.Map<String, Object> body = new java.util.HashMap<>();
        body.put("user_id", userId);
        body.put("request_content", requestContent);
        if (categoryId != null) {
            body.put("category_id", categoryId);
        }
        
        return this.webClient.post()
                .uri("/api/v1/ai/experts/match")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class);
    }
}
