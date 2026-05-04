package com.team.nexus.domain.license.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChecklistProgressDto {
    private Short currentStep;
    private Boolean completed;
}