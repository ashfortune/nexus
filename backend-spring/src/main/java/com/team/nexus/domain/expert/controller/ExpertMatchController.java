package com.team.nexus.domain.expert.controller;

import com.team.nexus.domain.expert.dto.ExpertMatchReqDto;
import com.team.nexus.domain.expert.dto.ExpertMatchResDto;
import com.team.nexus.domain.expert.service.ExpertMatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Expert Matching", description = "전문가 매칭 API")
@RestController
@RequestMapping("/api/v1/experts")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ExpertMatchController {

    private final ExpertMatchService expertMatchService;

    @Operation(summary = "전문가 AI 매칭 요청", description = "창업자의 요구사항을 바탕으로 AI가 적합한 전문가를 매칭합니다.")
    @PostMapping("/match")
    public ResponseEntity<ExpertMatchResDto> matchExpert(@RequestBody ExpertMatchReqDto reqDto) {
        try {
            ExpertMatchResDto response = expertMatchService.matchExpert(reqDto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // 서비스 계층에서 트랜잭션 롤백 등의 이유로 예외가 던져질 경우를 대비한 최후의 방어선
            return ResponseEntity.ok(ExpertMatchResDto.builder()
                    .matchRequestId(null)
                    .experts(new java.util.ArrayList<>())
                    .build());
        }
    }
}
