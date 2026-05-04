package com.team.nexus.domain.license.repository;

import com.team.nexus.global.entity.SurveyDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SurveyDocumentRepository extends JpaRepository<SurveyDocument, UUID> {
    List<SurveyDocument> findBySurveyIdInAndAnswerTrue(List<UUID> surveyIds);
}