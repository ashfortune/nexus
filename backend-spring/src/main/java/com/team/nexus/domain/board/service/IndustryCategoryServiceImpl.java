package com.team.nexus.domain.board.service;

import com.team.nexus.domain.board.dto.IndustryCategoryResponseDto;
import com.team.nexus.domain.board.repository.IndustryCategoryRepository;
import com.team.nexus.global.entity.IndustryCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IndustryCategoryServiceImpl implements IndustryCategoryService {

    private final IndustryCategoryRepository industryCategoryRepository;

    @Override
    public List<IndustryCategoryResponseDto> getMainCategories() {
        return industryCategoryRepository.findByLevelOrderByLevelAscNameAsc((short) 1)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<IndustryCategoryResponseDto> getSubCategories(UUID parentId) {
        return industryCategoryRepository.findByParentIdOrderByLevelAscNameAsc(parentId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private IndustryCategoryResponseDto convertToDto(IndustryCategory entity) {
        return IndustryCategoryResponseDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .level(entity.getLevel())
                .ksicCode(entity.getKsicCode())
                .parentId(entity.getParent() != null ? entity.getParent().getId() : null)
                .build();
    }
}
