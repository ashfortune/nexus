package com.team.nexus.domain.grouppurchase.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.HashMap;
import java.util.Map;

@Tag(name = "Group Purchase Config", description = "공동구매용 결제 설정값 제공 API")
@RestController
@RequestMapping("/api/v1/config")
@CrossOrigin(origins = "http://localhost:3000")
public class GroupPurchaseConfigController {

    @Value("${toss.client-key}")
    private String tossClientKey;

    @Value("${kakao.pay.client-id}")
    private String kakaoClientId;

    @Operation(summary = "공동구매 설정값 조회", description = "토스, 카카오페이 등 프론트엔드 결제에 필요한 설정을 조회합니다.")
    @GetMapping
    public ResponseEntity<Map<String, String>> getConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("tossClientKey", tossClientKey);
        config.put("kakaoClientId", kakaoClientId);
        return ResponseEntity.ok(config);
    }
}
