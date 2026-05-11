package com.team.nexus.domain.branding.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class BrandingListDto {
    private UUID id;
    private String title;
    private UUID industryCategoryId;
    private String currentStep;
    private String createdAt;
    private String lastModifiedAt;
    private String logoUrl;
}
