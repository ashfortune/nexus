package com.team.nexus.domain.license.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndustryCategoryDto {
    private UUID id;
    private String name;
    private Short level;
    private String ksicCode;
}