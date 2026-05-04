package com.team.nexus.domain.simulation.repository;

import com.team.nexus.domain.simulation.dto.SimIndustCatsDto;
import com.team.nexus.global.entity.SemasIndustryMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface SemasIndustCatsRepository extends JpaRepository<SemasIndustryMapping, UUID> {
    @Query("SELECT DISTINCT new com.team.nexus.domain.simulation.dto.SimIndustCatsDto(CONCAT(semas.mediumCategoryName, ' ', semas.smallCategoryName), semas.semasKsicCode) "
            + "FROM SemasIndustryMapping semas ")
    List<SimIndustCatsDto> findAllCategoryName();
}
