package com.team.nexus.domain.license.controller;

import com.team.nexus.domain.license.dto.IndustryCategoryDto;
import com.team.nexus.domain.license.dto.SurveyDto;
import com.team.nexus.domain.license.service.LicenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/industry")
@RequiredArgsConstructor
public class LicenseController {
    private final LicenseService licenseService;

    @GetMapping("/categories")
    public ResponseEntity<List<IndustryCategoryDto>> getCategories() {
        return ResponseEntity.ok(licenseService.getCategories());
    }

    @GetMapping("/categories/{parentId}")
    public ResponseEntity<List<IndustryCategoryDto>> getSubCategories(
            @PathVariable UUID parentId) {
        return ResponseEntity.ok(licenseService.getSubCategories(parentId));
    }

    @GetMapping("/{industryId}/surveys")
    public ResponseEntity<List<SurveyDto>> getSurveys(
            @PathVariable UUID industryId) {
        return ResponseEntity.ok(licenseService.getSurveys(industryId));
    }
}
