package com.team.nexus.domain.simulation.service;

import com.team.nexus.domain.simulation.dto.SimIndustCatsDto;
import com.team.nexus.domain.simulation.dto.SimRegCodesDto;
import com.team.nexus.domain.simulation.dto.SimSearchListDto;
import com.team.nexus.domain.simulation.repository.SemasIndustCatsRepository;
import com.team.nexus.domain.simulation.repository.SimIndustCatsRepository;
import com.team.nexus.domain.simulation.repository.SimRegCodesRepository;
import com.team.nexus.global.entity.RegionCode;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

// 구현체에서 Repository를 호출
@Service
@RequiredArgsConstructor
public class SimSearchListServiceImpl implements SimSearchListService {
        private final SimIndustCatsRepository simIndustCatsRepository;
        private final SemasIndustCatsRepository semasIndustCatsRepository;
        private final SimRegCodesRepository simRegCodesRepository;

        @Override
        @Transactional
        public SimSearchListDto getRegionSemasIndustryList() {
                List<SimIndustCatsDto> industCatsDto = semasIndustCatsRepository.findAllCategoryName();
                List<RegionCode> regCodesEntities = simRegCodesRepository.findAll();

                List<SimRegCodesDto> regCodesDto = regCodesEntities.stream()
                                .map(entity -> SimRegCodesDto.builder()
                                                .regionCode(entity.getRegionCode())
                                                .cityName(entity.getCityName())
                                                .countyName(entity.getCountyName())
                                                .latitude(entity.getLatitude())
                                                .longitude(entity.getLongitude())
                                                .build())
                                .toList();

                return SimSearchListDto.builder()
                                .simIndustCatsDto(industCatsDto)
                                .simRegCodesDto(regCodesDto)
                                .build();
        }

        @Override
        @Transactional
        public SimSearchListDto getRegionIndustryList() {
                List<SimIndustCatsDto> industCatsDto = simIndustCatsRepository.findLevel4UniqueByName();
                List<RegionCode> regCodesEntities = simRegCodesRepository.findAll();

                List<SimRegCodesDto> regCodesDto = regCodesEntities.stream()
                                .map(entity -> SimRegCodesDto.builder()
                                                .regionCode(entity.getRegionCode())
                                                .cityName(entity.getCityName())
                                                .countyName(entity.getCountyName())
                                                .latitude(entity.getLatitude())
                                                .longitude(entity.getLongitude())
                                                .build())
                                .toList();

                return SimSearchListDto.builder()
                                .simIndustCatsDto(industCatsDto)
                                .simRegCodesDto(regCodesDto)
                                .build();
        }
}
