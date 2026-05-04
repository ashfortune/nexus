package com.team.nexus.domain.simulation.repository;

import com.team.nexus.global.entity.RegionCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SimRegCodesRepository extends JpaRepository<RegionCode, UUID> {
}
