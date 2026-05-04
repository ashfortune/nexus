package com.team.nexus.domain.simulation.service;

import com.team.nexus.domain.simulation.dto.ProcessedRealEstateDto;

import java.util.List;

public interface RealEstateService {
    // List<RealEstateResponseItemDto> getRealEstateList(Integer regionCode);
    List<ProcessedRealEstateDto> getProcessedRealEstateList(Integer regionCode);
}
