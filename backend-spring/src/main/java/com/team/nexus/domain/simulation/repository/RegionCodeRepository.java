package com.team.nexus.domain.simulation.repository;

import com.team.nexus.global.entity.RegionCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RegionCodeRepository extends JpaRepository<RegionCode, UUID> {
    Optional<RegionCode> findByRegionCode(Integer regionCode);
}
