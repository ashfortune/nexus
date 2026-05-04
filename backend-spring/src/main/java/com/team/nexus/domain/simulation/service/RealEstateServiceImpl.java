package com.team.nexus.domain.simulation.service;

import com.team.nexus.domain.simulation.dto.ProcessedRealEstateDto;
import com.team.nexus.domain.simulation.dto.RealEstateAPIResponseDto;
import com.team.nexus.domain.simulation.dto.RealEstateResponseItemDto;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;

@Service
@RequiredArgsConstructor
public class RealEstateServiceImpl implements RealEstateService {
    private final APIProperties apiProperties;
    private final WebClient dataPortalRealEstateWebClient;
    private static final XmlMapper XML_MAPPER = new XmlMapper();

    private static final int TARGET_COUNT = 5;

    @Override
    @Transactional
    public List<ProcessedRealEstateDto> getProcessedRealEstateList(Integer regionCode) {
        LocalDate searchDate = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMM");

        List<ProcessedRealEstateDto> under100M = new ArrayList<>();
        List<ProcessedRealEstateDto> over100M = new ArrayList<>();

        // 최신 달부터 순서대로 조회, 5+5 채워지면 즉시 중단
        for (int i = 0; i < 12; i++) {
            String dealYMD = searchDate.minusMonths(i).format(formatter);
            boolean filled = fetchMonthUntilFull(regionCode, dealYMD, under100M, over100M);
            if (filled)
                break;
        }

        return combine(under100M, over100M);
    }

    /**
     * 해당 월의 API를 페이지 순서대로 호출하며 under/over 리스트를 채운다.
     * 두 리스트가 모두 TARGET_COUNT에 도달하면 즉시 true를 반환(조기 종료).
     */
    private boolean fetchMonthUntilFull(Integer regionCode, String dealYMD,
            List<ProcessedRealEstateDto> under100M,
            List<ProcessedRealEstateDto> over100M) {
        int pageNo = 1;
        while (true) {
            RealEstateAPIResponseDto response = fetchApi(regionCode, dealYMD, pageNo);
            if (response == null || response.getResponse() == null || response.getResponse().getBody() == null) {
                break;
            }
            var body = response.getResponse().getBody();
            var items = body.getItems() != null ? body.getItems().getItem() : null;

            if (items != null) {
                for (var item : items) {
                    ProcessedRealEstateDto dto = mapAndCalculate(item);
                    if (Boolean.TRUE.equals(dto.getIsWithin100M())) {
                        if (under100M.size() < TARGET_COUNT)
                            under100M.add(dto);
                    } else {
                        if (over100M.size() < TARGET_COUNT)
                            over100M.add(dto);
                    }
                    // 두 버킷 모두 채워지면 즉시 종료
                    if (under100M.size() >= TARGET_COUNT && over100M.size() >= TARGET_COUNT) {
                        return true;
                    }
                }
            }

            // 다음 페이지 존재 여부 확인
            if (body.getNumOfRows() > 0 && body.getTotalCount() > 0
                    && pageNo * body.getNumOfRows() < body.getTotalCount()) {
                pageNo++;
            } else {
                break;
            }
        }
        return under100M.size() >= TARGET_COUNT && over100M.size() >= TARGET_COUNT;
    }

    private RealEstateAPIResponseDto fetchApi(Integer regionCode, String dealYMD, int pageNo) {
        try {
            String xmlResponse = dataPortalRealEstateWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("serviceKey", apiProperties.getDataPortal().getKey())
                            .queryParam("LAWD_CD", regionCode)
                            .queryParam("DEAL_YMD", dealYMD)
                            .queryParam("pageNo", pageNo)
                            .queryParam("numOfRows", 20)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return XML_MAPPER.readValue(xmlResponse, RealEstateAPIResponseDto.class);
        } catch (Exception e) {
            System.err.println("Error fetching real estate data: " + e.getMessage());
            return null;
        }
    }

    private ProcessedRealEstateDto mapAndCalculate(RealEstateResponseItemDto raw) {
        ProcessedRealEstateDto dto = new ProcessedRealEstateDto();

        dto.setBuildingAr(raw.buildingAr);
        dto.setLandUse(raw.landUse);
        dto.setBuildingType(raw.buildingType);
        dto.setBuildingUse(raw.buildingUse);
        dto.setFloor(raw.floor);
        dto.setDealAmount(raw.dealAmount);

        if (raw.sggNm != null && raw.umdNm != null) {
            dto.setAddress(raw.sggNm.trim() + " " + raw.umdNm.trim());
        }

        if (raw.dealYear != null && raw.dealMonth != null && raw.dealDay != null) {
            dto.setDealDate(String.format("%s-%02d-%02d",
                    raw.dealYear.trim(),
                    Integer.parseInt(raw.dealMonth.trim()),
                    Integer.parseInt(raw.dealDay.trim())));
        }

        if (raw.buildYear != null && !raw.buildYear.isBlank()) {
            dto.setBuildAge(LocalDate.now().getYear() - Integer.parseInt(raw.buildYear.trim()));
        }

        // isWithin100M, pricePerPyeong 은 getter에서 동적으로 계산되므로 별도 setter 불필요

        return dto;
    }

    private List<ProcessedRealEstateDto> combine(List<ProcessedRealEstateDto> a, List<ProcessedRealEstateDto> b) {
        List<ProcessedRealEstateDto> res = new ArrayList<>(a);
        res.addAll(b);
        return res;
    }
}