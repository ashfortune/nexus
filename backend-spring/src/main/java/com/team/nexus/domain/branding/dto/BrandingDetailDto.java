package com.team.nexus.domain.branding.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class BrandingDetailDto {
    private UUID id;
    private String title;
    private UUID industryCategoryId;
    private Map<String, Object> keywords;
    private String currentStep;
    private String createdAt;
    private Object chatHistory;
    private List<BrandIdentityDto> identities;
}
