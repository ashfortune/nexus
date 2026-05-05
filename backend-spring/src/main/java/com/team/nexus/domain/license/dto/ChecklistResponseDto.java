package com.team.nexus.domain.license.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistResponseDto {
    private String industryName;
    private String licenseType;
    private List<StepDto> steps;
    private List<String> documentSummary;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StepDto {
        private UUID progressId;
        private Short orderNum;
        private String place;
        private String task;
        private String estimatedDays;
        private List<String> documents;
    }
}