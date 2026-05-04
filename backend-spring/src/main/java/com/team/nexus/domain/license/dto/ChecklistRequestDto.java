package com.team.nexus.domain.license.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Getter
@NoArgsConstructor
public class ChecklistRequestDto {
    private UUID industryId;
    private List<SurveyAnswerDto> answers;

    @Getter
    @NoArgsConstructor
    public static class SurveyAnswerDto {
        private UUID surveyId;
        private Boolean answer;
    }
}