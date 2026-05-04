package com.team.nexus.domain.simulation.service;

import com.team.nexus.domain.simulation.dto.StoreMapResponseDto;

public interface StoresService {
    StoreMapResponseDto getStoreList(String signguCd, String semasKsicCode);
}
