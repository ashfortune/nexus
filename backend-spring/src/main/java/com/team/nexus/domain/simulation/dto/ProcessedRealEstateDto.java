package com.team.nexus.domain.simulation.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ProcessedRealEstateDto {
    private String buildingAr; // 제곱미터 단위
    private String landUse; // 일반상업(용도지역)

    private String buildingType; // 건물유형(일반/집합)
    private String buildingUse; // 건물주용도 (판매, 교육연구 등)
    private String floor; // 층

    // 파생속성
    private String address; // sggNm + umdNm (성북구 동선동2가)
    private String dealAmount; // 거래금액(만원)
    private Long pricePerPyeong; // dealAmount /(buildingAr * 0.3025)
    private String dealDate; // dealYear + dealMonth + dealDay
    private Integer buildAge; // thisYear - buildYear
    private Boolean isWithin100M; // dealAmount <= 100M

    public Long getDealAmount() {
        if (dealAmount == null || dealAmount.isBlank())
            return null;
        return Long.parseLong(dealAmount.trim().replace(",", "")) * 10_000L;
    }

    public Long getPricePerPyeong() {
        if (buildingAr == null || buildingAr.isBlank())
            return null;
        return (long) (getDealAmount() / (Double.parseDouble(buildingAr.trim()) * 0.3025));
    }

    public Boolean getIsWithin100M() {
        if (getDealAmount() == null)
            return null;
        return getDealAmount() <= 100_000_000L;
    }
}
