package com.team.nexus.domain.board.service;

import com.team.nexus.domain.board.dto.IndustryCategoryResponseDto;
import java.util.List;
import java.util.UUID;

public interface IndustryCategoryService {
    List<IndustryCategoryResponseDto> getMainCategories();
    List<IndustryCategoryResponseDto> getSubCategories(UUID parentId);
}
