package com.team.nexus.domain.simulation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
@Data
public class EquipPriceResponseDto {
    // industry_category_id가 아닌 실제 업종명(국문)
    @JsonProperty("industry_name")
    private String industryName;
    // 필수장비 수
    @JsonProperty("essential_equip_cnt")
    private Integer essentialEquipCnt;

    // 네이버로 검색된 가격 수
    @JsonProperty("naver_sources_cnt")
    private Integer naverSourcesCnt;
    // RAG로 검색된 가격 수
    @JsonProperty("rag_sources_cnt")
    private Integer ragSourcesCnt;
    // LLM으로 검색된 가격 수
    @JsonProperty("llm_sources_cnt")
    private Integer llmSourcesCnt;
    // 수작업으로 작성한 가격 수
    @JsonProperty("human_sources_cnt")
    private Integer humanSourcesCnt;
    // 장비 리스트
    @JsonProperty("equip_prices")
    private List<EquipPriceItem> equipPriceItems;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @ToString
    // DB 조회 결과물 -> 장비별
    public static class EquipPriceItem {
        // 국문/영문이름
        @JsonProperty("equip_name_kr")
        private String equipNameKR;
        @JsonProperty("equip_name_eng")
        private String equipNameEng;
        // 판매명
        @JsonProperty("product_name")
        private String productName;
        // 판매가
        @JsonProperty("product_price")
        private Integer productPrice;
        // 장비 설명
        private String detail;
        // NAVER로 검색된 경우 링크, 이미지 url 존재
        // TODO: NAVER 검색이 아닌 경우
        private String link;
        private String imageUrl;
        // 검색 단계 (NAVER, RAG, LLM, HUMAN 중 어디인지)
        private String source;
    }
}
