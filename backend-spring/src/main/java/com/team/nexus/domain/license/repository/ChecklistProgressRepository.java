package com.team.nexus.domain.license.repository;

import com.team.nexus.global.entity.ChecklistProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChecklistProgressRepository extends JpaRepository<ChecklistProgress, UUID> {
    Optional<ChecklistProgress> findByUserIdAndLicenseIndustryId(UUID userId, UUID licenseIndustryId);
    java.util.List<ChecklistProgress> findByUserId(UUID userId);
}