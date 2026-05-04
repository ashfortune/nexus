package com.team.nexus.domain.license.service;

import com.team.nexus.domain.license.dto.*;
import java.util.List;
import java.util.UUID;

public interface LicenseService {
    List<IndustryCategoryDto> getCategories();
    List<IndustryCategoryDto> getSubCategories(UUID parentId);
    List<SurveyDto> getSurveys(UUID industryId);
    ChecklistResponseDto createChecklist(ChecklistRequestDto request);
    void updateStep(UUID progressId, ChecklistProgressDto request);
}