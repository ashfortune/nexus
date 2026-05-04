package com.team.nexus.domain.simulation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
// region_codes 테이블에서 필요한 속성 (지역코드, 시/도명, 군/구명)
public class SimRegCodesDto {
    private Integer regionCode;
    private String cityName;
    private String countyName;
    private Double latitude;
    private Double longitude;
}
