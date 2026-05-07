package com.team.nexus.domain.sales.service;

import com.team.nexus.domain.sales.dto.SalesDataDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface SalesService {
    void saveOrUpdateSales(UUID userId, List<SalesDataDTO> dataList);
    List<SalesDataDTO> parseCsv(MultipartFile file);
    Map<String, Object> triggerAnalysis(String userId);
    Map<String, Object> getLatestAnalysis(String userId);
}
