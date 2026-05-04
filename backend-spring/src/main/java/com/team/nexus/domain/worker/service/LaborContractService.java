package com.team.nexus.domain.worker.service;

import com.team.nexus.domain.worker.dto.LaborContractRequestDto;

public interface LaborContractService {
    byte[] generateContract(LaborContractRequestDto request) throws Exception;
}