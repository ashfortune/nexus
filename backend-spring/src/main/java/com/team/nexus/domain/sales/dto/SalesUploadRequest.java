package com.team.nexus.domain.sales.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class SalesUploadRequest {
    private UUID userId;
    private List<SalesDataDTO> data;
}
