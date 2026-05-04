package com.team.nexus.domain.license.repository;

import com.team.nexus.global.entity.Survey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SurveyRepository extends JpaRepository<Survey, UUID> {
    List<Survey> findByLicenseIndustryIdOrderByOrderNumAsc(UUID licenseIndustryId);
}