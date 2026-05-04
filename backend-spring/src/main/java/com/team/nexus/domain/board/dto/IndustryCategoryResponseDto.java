package com.team.nexus.domain.board.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class IndustryCategoryResponseDto {
    private UUID id;
    private String name;
    private Short level;
    private String ksicCode;
    private UUID parentId;
}
