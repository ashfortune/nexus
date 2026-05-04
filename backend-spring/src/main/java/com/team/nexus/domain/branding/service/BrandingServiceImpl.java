package com.team.nexus.domain.branding.service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.team.nexus.domain.branding.dto.BrandIdentityDto;
import com.team.nexus.domain.branding.dto.BrandingDetailDto;
import com.team.nexus.domain.branding.dto.BrandingListDto;
import com.team.nexus.domain.branding.dto.MarketingAssetDto;
import com.team.nexus.domain.branding.repository.BrandIdentityRepository;
import com.team.nexus.domain.branding.repository.BrandingRepository;
import com.team.nexus.domain.branding.repository.LogoAssetRepository;
import com.team.nexus.domain.branding.repository.MarketingAssetRepository;
import com.team.nexus.global.entity.BrandIdentity;
import com.team.nexus.global.entity.Branding;
import com.team.nexus.global.entity.LogoAsset;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BrandingServiceImpl implements BrandingService {

        private final BrandingRepository brandingRepository;
        private final BrandIdentityRepository brandIdentityRepository;
        private final LogoAssetRepository logoAssetRepository;
        private final MarketingAssetRepository marketingAssetRepository;
        private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

        @Override
        public List<BrandingListDto> getBrandingList(UUID userId) {
                return brandingRepository.findByUserId(userId).stream()
                                .map(branding -> {
                                        String logoUrl = logoAssetRepository
                                                        .findFinalLogoUrlByBrandingId(branding.getId())
                                                        .stream().findFirst().orElse(null);

                                        return BrandingListDto.builder()
                                                        .id(branding.getId())
                                                        .title(branding.getTitle())
                                                        .industryCategoryId(branding.getIndustryCategoryId())
                                                        .currentStep(branding.getCurrentStep())
                                                        .createdAt(branding.getCreatedAt() != null
                                                                        ? branding.getCreatedAt().format(DATE_FORMATTER)
                                                                        : null)
                                                        .logoUrl(logoUrl)
                                                        .build();
                                })
                                .collect(Collectors.toList());
        }

        @Override
        public BrandingDetailDto getBrandingDetail(UUID id) {
                Branding branding = brandingRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Branding not found"));

                List<BrandIdentityDto> identities = brandIdentityRepository.findDtoByBrandingId(branding.getId());

                // identities DTO들에 로고 및 마케팅 에셋 정보 추가
                for (BrandIdentityDto dto : identities) {
                    dto.setLogoUrl(logoAssetRepository.findByBrandIdentityId(dto.getId()).stream()
                            .filter(logo -> Boolean.TRUE.equals(logo.getIsFinal()))
                            .findFirst()
                            .map(LogoAsset::getImageUrl)
                            .orElse(null));
                    
                    dto.setMarketingAssets(marketingAssetRepository.findByBrandIdentityId(dto.getId()).stream()
                            .map(asset -> MarketingAssetDto.builder()
                                    .id(asset.getId())
                                    .type(asset.getType())
                                    .fileUrl(asset.getFileUrl())
                                    .build())
                            .collect(Collectors.toList()));
                }

                return BrandingDetailDto.builder()
                                .id(branding.getId())
                                .title(branding.getTitle())
                                .industryCategoryId(branding.getIndustryCategoryId())
                                .keywords(branding.getKeywords())
                                .currentStep(branding.getCurrentStep())
                                .createdAt(branding.getCreatedAt() != null
                                                ? branding.getCreatedAt().format(DATE_FORMATTER)
                                                : null)
                                .chatHistory(branding.getChatHistory())
                                .identities(identities)
                                .build();
        }

        @Override
        @Transactional
        public void deleteBranding(UUID id) {
                if (!brandingRepository.existsById(id)) {
                        throw new RuntimeException("Branding not found");
                }
                brandingRepository.deleteById(id);
        }
}
