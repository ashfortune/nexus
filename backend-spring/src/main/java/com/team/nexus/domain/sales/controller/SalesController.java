package com.team.nexus.domain.sales.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.team.nexus.domain.sales.dto.SalesDataDTO;
import com.team.nexus.domain.sales.dto.SalesUploadRequest;
import com.team.nexus.domain.sales.service.SalesService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Tag(name = "Sales", description = "매출 데이터 관리 API")
@Slf4j
@RestController
@RequestMapping("/api/v1/sales")
@RequiredArgsConstructor
public class SalesController {

    private final SalesService salesService;

    @Operation(summary = "매출 CSV 업로드 및 파싱")
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadSalesCsv(@RequestParam("file") MultipartFile file) {
        log.info("매출 CSV 업로드 요청 수신: {}", file.getOriginalFilename());
        List<SalesDataDTO> data = salesService.parseCsv(file);

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "CSV 데이터가 성공적으로 파싱되었습니다.",
                "data", data));
    }

    @Operation(summary = "매출 데이터 저장 (덮어쓰기 지원)")
    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> saveSales(@RequestBody SalesUploadRequest request) {
        log.info("매출 데이터 저장 요청 수신: user={}, count={}", request.getUserId(), request.getData().size());
        salesService.saveOrUpdateSales(request.getUserId(), request.getData());
        
        // 데이터 저장이 커밋된 후 안전하게 AI 분석 요청 (옵션 B)
        try {
            salesService.triggerAnalysis(request.getUserId().toString());
            log.info("데이터 저장 후 자동 AI 분석 요청 완료: user={}", request.getUserId());
        } catch (Exception e) {
            log.error("자동 AI 분석 요청 실패 (저장은 완료됨): {}", e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", request.getData().size() + "건의 매출 데이터가 안전하게 저장되었습니다."));
    }

    @Operation(summary = "AI 매출 분석 시작 요청")
    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyzeSales(@RequestParam("userId") String userId) {
        log.info("매출 데이터 AI 분석 요청 수신: user={}", userId);
        Map<String, Object> result = salesService.triggerAnalysis(userId);

        return ResponseEntity.ok(result);
    }

    @Operation(summary = "최신 AI 분석 결과 조회")
    @GetMapping("/results")
    public ResponseEntity<Map<String, Object>> getAnalysisResults(@RequestParam("userId") String userId) {
        log.info("매출 분석 결과 조회 요청 수신: user={}", userId);
        Map<String, Object> result = salesService.getLatestAnalysis(userId);

        return ResponseEntity.ok(result);
    }
}
