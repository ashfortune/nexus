package com.team.nexus.domain.worker.service;

import com.team.nexus.domain.worker.dto.WorkerRequestDto;
import com.team.nexus.domain.worker.dto.WorkerResponseDto;

public interface WorkerService {
    WorkerResponseDto calculate(WorkerRequestDto request);
}