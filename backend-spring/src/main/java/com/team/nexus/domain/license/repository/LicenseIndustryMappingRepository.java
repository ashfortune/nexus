package com.team.nexus.domain.license.repository;

import com.team.nexus.global.entity.LicenseIndustryMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LicenseIndustryMappingRepository extends JpaRepository<LicenseIndustryMapping, UUID> {
    Optional<LicenseIndustryMapping> findByIndustryCategoryId(UUID industryCategoryId);
}