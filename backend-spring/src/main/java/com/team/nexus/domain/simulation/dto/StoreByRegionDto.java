package com.team.nexus.domain.simulation.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreByRegionDto {
    // 행정동 코드 (8자리)
    private String adongCd;
    // 행정동 이름
    private String adongNm;
    // 업소수
    private Integer count;
    // 행정동 경계 좌표
    private JsonNode geometry;
}
