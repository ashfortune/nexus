package com.team.nexus.domain.branding.dto;
import lombok.Builder;
import lombok.Getter;
import java.util.UUID;

@Getter
@Builder
public class MarketingAssetDto {
    private UUID id;
    private String type;
    private String fileUrl;
}
