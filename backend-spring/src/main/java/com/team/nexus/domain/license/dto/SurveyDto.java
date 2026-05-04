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
public class SurveyDto {
    private UUID id;
    private String question;
    private Short orderNum;
}