package com.team.nexus.domain.simulation.service;

import com.team.nexus.domain.simulation.dto.EquipPriceResponseDto;
import com.team.nexus.domain.simulation.repository.EquipPriceRepository;
import com.team.nexus.domain.simulation.repository.IndustryCategoryQueryRepository;
import com.team.nexus.global.entity.EquipmentPrice;
import com.team.nexus.global.entity.IndustryCategory;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipPriceServiceImpl implements EquipPriceService {
        private final EquipPriceRepository equipPriceRepository;
        private final IndustryCategoryQueryRepository industryCategoryQueryRepository;

        @Override
        @Transactional
        public EquipPriceResponseDto getEquipPriceList(String ksicCode) {
                IndustryCategory industryCategory = industryCategoryQueryRepository.findFirstByKsicCode(ksicCode)
                                .orElseThrow(() -> new RuntimeException(
                                                "Industry Category not found for ksicCode: " + ksicCode));

                List<EquipmentPrice> equipmentPrices = equipPriceRepository
                                .findByIndustryCategoryId(industryCategory.getId());

                int naverCnt = (int) equipPriceRepository.countByIndustryCategoryIdAndSource(industryCategory.getId(),
                                "NAVER");
                int ragCnt = (int) equipPriceRepository.countByIndustryCategoryIdAndSource(industryCategory.getId(),
                                "RAG");
                int llmCnt = (int) equipPriceRepository.countByIndustryCategoryIdAndSource(industryCategory.getId(),
                                "LLM");
                llmCnt += (int) equipPriceRepository.countByIndustryCategoryIdAndSource(industryCategory.getId(),
                                "LLM_NAVER_FIX");
                int humanCnt = (int) equipPriceRepository.countByIndustryCategoryIdAndSource(industryCategory.getId(),
                                "HUMAN");

                List<EquipPriceResponseDto.EquipPriceItem> items = equipmentPrices.stream()
                                .map(ep -> EquipPriceResponseDto.EquipPriceItem.builder()
                                                .equipNameKR(ep.getEquipment_kr())
                                                .equipNameEng(ep.getEquipment_eng())
                                                .productName(ep.getProduct_name())
                                                .productPrice(ep.getPrice())
                                                .detail(ep.getDetail())
                                                .link(ep.getLink())
                                                .imageUrl(ep.getImage_url())
                                                .source(ep.getSource())
                                                .build())
                                .toList();

                return EquipPriceResponseDto.builder()
                                .industryName(industryCategory.getName())
                                .essentialEquipCnt(items.size())
                                .naverSourcesCnt(naverCnt)
                                .ragSourcesCnt(ragCnt)
                                .llmSourcesCnt(llmCnt)
                                .humanSourcesCnt(humanCnt)
                                .equipPriceItems(items)
                                .build();
        }
}
