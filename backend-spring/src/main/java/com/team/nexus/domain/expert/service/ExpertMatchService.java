package com.team.nexus.domain.expert.service;

import com.team.nexus.domain.expert.dto.ExpertMatchReqDto;
import com.team.nexus.domain.expert.dto.ExpertMatchResDto;

public interface ExpertMatchService {
    ExpertMatchResDto matchExpert(ExpertMatchReqDto reqDto);
}
