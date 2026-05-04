package com.team.nexus.domain.simulation.dto;

import lombok.*;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// store GET 요청 응답
public class StoresResponseDto {
    // 전체 업소 수
    private Integer totalCount;
    // 지역별 업소 정보
    private List<StoreByRegionDto> storeByRegionDtoList;
    // 업소가 가장 많은 지역
    private StoreByRegionDto mostRegion;
    // 업소가 가장 적은 지역
    private StoreByRegionDto leastRegion;
}
