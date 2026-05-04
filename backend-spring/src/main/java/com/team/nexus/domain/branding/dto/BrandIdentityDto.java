package com.team.nexus.domain.branding.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandIdentityDto {
    private UUID id;
    private String brandName;
    private String slogan;
    private String brandStory;
    private Boolean isSelected;
    private String logoUrl;
    private List<MarketingAssetDto> marketingAssets;

    // JPQL 조회를 위한 5개 필드 생성자
    public BrandIdentityDto(UUID id, String brandName, String slogan, String brandStory, Boolean isSelected) {
        this.id = id;
        this.brandName = brandName;
        this.slogan = slogan;
        this.brandStory = brandStory;
        this.isSelected = isSelected;
    }
}
