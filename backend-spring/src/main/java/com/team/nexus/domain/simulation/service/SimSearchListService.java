package com.team.nexus.domain.simulation.service;

import com.team.nexus.domain.simulation.dto.SimSearchListDto;
import jakarta.transaction.Transactional;

@Transactional
public interface SimSearchListService {
    SimSearchListDto getRegionIndustryList();

    SimSearchListDto getRegionSemasIndustryList();
}
