package com.team.nexus.domain.sales.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
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

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", request.getData().size() + "건의 매출 데이터가 안전하게 저장되었습니다."));
    }
}
