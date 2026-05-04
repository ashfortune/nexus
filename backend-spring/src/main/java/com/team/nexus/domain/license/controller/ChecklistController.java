package com.team.nexus.domain.license.controller;

import com.team.nexus.domain.license.dto.*;
import com.team.nexus.domain.license.service.LicenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/checklist")
@RequiredArgsConstructor
public class ChecklistController {

    private final LicenseService licenseService;

    @PostMapping("/create")
    public ResponseEntity<ChecklistResponseDto> createChecklist(
            @RequestBody ChecklistRequestDto request) {
        return ResponseEntity.ok(licenseService.createChecklist(request));
    }

    @PatchMapping("/{progressId}/step")
    public ResponseEntity<Void> updateStep(
            @PathVariable UUID progressId,
            @RequestBody ChecklistProgressDto request) {
        licenseService.updateStep(progressId, request);
        return ResponseEntity.ok().build();
    }
}