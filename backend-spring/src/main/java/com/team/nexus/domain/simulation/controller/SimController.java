package com.team.nexus.domain.simulation.controller;

import com.team.nexus.domain.simulation.dto.StoreMapResponseDto;
import com.team.nexus.domain.simulation.dto.EquipPriceResponseDto;
import com.team.nexus.domain.simulation.dto.ProcessedRealEstateDto;
import com.team.nexus.domain.simulation.dto.SimSearchListDto;
import com.team.nexus.domain.simulation.service.EquipPriceService;
import com.team.nexus.domain.simulation.service.RealEstateService;
import com.team.nexus.domain.simulation.service.SimSearchListService;
import com.team.nexus.domain.simulation.service.StoresService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/sim")
@RequiredArgsConstructor
public class SimController {
    private final SimSearchListService simSearchListService;
    private final RealEstateService realEstateService;
    private final EquipPriceService equipPriceService;
    private final StoresService storesService;

    // 창업 시뮬레이션 업종 및 지역 검색 리스트
    @GetMapping("/search-list")
    public ResponseEntity<SimSearchListDto> getSearchList() {
        return ResponseEntity.ok(simSearchListService.getRegionIndustryList());
    }

    // 상권지도 업종 및 지역 검색 리스트
    @GetMapping("/store-list")
    public ResponseEntity<SimSearchListDto> getStoreList() {
        return ResponseEntity.ok(simSearchListService.getRegionSemasIndustryList());
    }

    // 지역기반 상업용 부동산 매매가 요청
    @GetMapping("/real-estate")
    public ResponseEntity<List<ProcessedRealEstateDto>> getProcessedRealEstateList(
            @RequestParam(defaultValue = "11110") Integer regionCode) {
        return ResponseEntity.ok(realEstateService.getProcessedRealEstateList(regionCode));
    }

    // 업종기반 필수설비 및 장비별 가격 요청
    @GetMapping("/equip-price")
    public ResponseEntity<EquipPriceResponseDto> getEquipPriceList(
            @RequestParam(defaultValue = "R91121") String ksicCode) {
        return ResponseEntity.ok(equipPriceService.getEquipPriceList(ksicCode));
    }

    // 업종기반 지역 내 업소수 요청
    @GetMapping("/stores")
    public ResponseEntity<StoreMapResponseDto> getStore(
            @RequestParam String signguCd,
            @RequestParam(defaultValue = "G20405") String semasKsicCode) {
        return ResponseEntity.ok(storesService.getStoreList(signguCd, semasKsicCode));
    }
}
