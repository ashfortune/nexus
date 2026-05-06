package com.team.nexus.domain.expert.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ExpertMatchReqDto {
    private UUID userId;
    private UUID industryCategoryId;
    private String requestContent;
}
