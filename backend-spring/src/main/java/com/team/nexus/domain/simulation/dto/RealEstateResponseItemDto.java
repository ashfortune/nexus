package com.team.nexus.domain.simulation.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RealEstateResponseItemDto {
    // API 원본 응답 매핑
    public String sggCd;
    public String sggNm;
    public String umdNm;
    public String buildingType;
    public String jibun;
    public String buildingUse;
    public String landUse;
    public String dealYear;
    public String dealMonth;
    public String dealDay;
    public String floor;
    public String buildYear;
    public String dealAmount;
    public String shareDealingType;
    public String plottageAr;
    public String buildingAr;
    public String cdealType;
    public String cdealDay;
    public String dealingGbn;
    public String estateAgentSggNm;
    public String slerGbn;
    public String buyerGbn;
}
