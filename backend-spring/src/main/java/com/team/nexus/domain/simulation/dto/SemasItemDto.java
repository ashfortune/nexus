package com.team.nexus.domain.simulation.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SemasItemDto {
    private String adongCd;
    private String adongNm;
}