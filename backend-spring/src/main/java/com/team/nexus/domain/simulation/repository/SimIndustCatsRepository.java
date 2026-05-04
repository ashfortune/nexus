package com.team.nexus.domain.simulation.repository;

import com.team.nexus.global.entity.IndustryCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.team.nexus.domain.simulation.dto.SimIndustCatsDto;

import java.util.List;
import java.util.UUID;

// JPA 로직으로 DB 조회
public interface SimIndustCatsRepository extends JpaRepository<IndustryCategory, UUID> {
    // level이 4이면서 업종명이 중복되지 않는 row 반환
    @Query("SELECT DISTINCT new com.team.nexus.domain.simulation.dto.SimIndustCatsDto(ic.name, ic.ksicCode) " +
            "FROM IndustryCategory ic " +
            "WHERE ic.level = 4")
    List<SimIndustCatsDto> findLevel4UniqueByName();
}
