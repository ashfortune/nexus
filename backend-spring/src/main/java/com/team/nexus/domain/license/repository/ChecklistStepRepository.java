package com.team.nexus.domain.license.repository;

import com.team.nexus.global.entity.ChecklistStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChecklistStepRepository extends JpaRepository<ChecklistStep, UUID> {
    List<ChecklistStep> findByLicenseIndustryIdOrderByOrderNumAsc(UUID licenseIndustryId);
}