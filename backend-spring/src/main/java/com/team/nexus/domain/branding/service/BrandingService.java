package com.team.nexus.domain.branding.service;

import com.team.nexus.domain.branding.dto.BrandingDetailDto;
import com.team.nexus.domain.branding.dto.BrandingListDto;

import java.util.List;
import java.util.UUID;

public interface BrandingService {
    List<BrandingListDto> getBrandingList(UUID userId);
    BrandingDetailDto getBrandingDetail(UUID id);
    void deleteBranding(UUID id);
}
