package com.team.nexus.domain.branding.controller;

import com.team.nexus.domain.branding.dto.BrandingDetailDto;
import com.team.nexus.domain.branding.dto.BrandingListDto;
import com.team.nexus.domain.branding.service.BrandingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Branding", description = "브랜딩 관리 API")
@RestController
@RequestMapping("/api/v1/branding")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class BrandingController {

    private final BrandingService brandingService;

    @Operation(summary = "브랜딩 목록 조회", description = "사용자의 브랜딩 프로젝트 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<List<BrandingListDto>> getBrandingList(@RequestParam UUID userId) {
        return ResponseEntity.ok(brandingService.getBrandingList(userId));
    }

    @Operation(summary = "브랜딩 상세 조회", description = "특정 브랜딩 프로젝트의 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<BrandingDetailDto> getBrandingDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(brandingService.getBrandingDetail(id));
    }

    @Operation(summary = "브랜딩 삭제", description = "특정 브랜딩 프로젝트를 삭제합니다.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBranding(@PathVariable UUID id) {
        brandingService.deleteBranding(id);
        return ResponseEntity.noContent().build();
    }
}
