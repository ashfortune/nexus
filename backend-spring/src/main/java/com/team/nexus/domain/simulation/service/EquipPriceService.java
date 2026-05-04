package com.team.nexus.domain.simulation.service;

import com.team.nexus.domain.simulation.dto.EquipPriceResponseDto;

public interface EquipPriceService {
    EquipPriceResponseDto getEquipPriceList(String ksicCode);
}
