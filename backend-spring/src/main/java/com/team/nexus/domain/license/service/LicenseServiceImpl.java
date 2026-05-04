// domain/license/service/LicenseServiceImpl.java
package com.team.nexus.domain.license.service;

import com.team.nexus.domain.license.dto.*;
import com.team.nexus.domain.license.repository.*;
import com.team.nexus.global.entity.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LicenseServiceImpl implements LicenseService {

    private final IndustryCategoryRepository industryCategoryRepository;
    private final LicenseIndustryMappingRepository licenseIndustryMappingRepository;
    private final SurveyRepository surveyRepository;
    private final DocumentRepository documentRepository;
    private final SurveyDocumentRepository surveyDocumentRepository;
    private final ChecklistStepRepository checklistStepRepository;
    private final ChecklistProgressRepository checklistProgressRepository;

    @Override
    public List<IndustryCategoryDto> getCategories() {
        return industryCategoryRepository.findByParentIsNull()
                .stream()
                .map(c -> IndustryCategoryDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .level(c.getLevel())
                        .ksicCode(c.getKsicCode())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<IndustryCategoryDto> getSubCategories(UUID parentId) {
        return industryCategoryRepository.findByParentId(parentId)
                .stream()
                .map(c -> IndustryCategoryDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .level(c.getLevel())
                        .ksicCode(c.getKsicCode())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<SurveyDto> getSurveys(UUID industryId) {
        LicenseIndustryMapping mapping = licenseIndustryMappingRepository
                .findByIndustryCategoryId(industryId)
                .orElseThrow(() -> new RuntimeException("해당 업종의 인허가 정보를 찾을 수 없습니다."));

        return surveyRepository
                .findByLicenseIndustryIdOrderByOrderNumAsc(mapping.getLicenseIndustry().getId())
                .stream()
                .map(s -> SurveyDto.builder()
                        .id(s.getId())
                        .question(s.getQuestion())
                        .orderNum(s.getOrderNum())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public ChecklistResponseDto createChecklist(ChecklistRequestDto request) {
        LicenseIndustryMapping mapping = licenseIndustryMappingRepository
                .findByIndustryCategoryId(request.getIndustryId())
                .orElseThrow(() -> new RuntimeException("해당 업종의 인허가 정보를 찾을 수 없습니다."));

        LicenseIndustry licenseIndustry = mapping.getLicenseIndustry();

        List<Document> commonDocuments = documentRepository
                .findByLicenseIndustryIdAndIsCommonTrue(licenseIndustry.getId());

        List<UUID> trueSurveyIds = request.getAnswers().stream()
                .filter(a -> Boolean.TRUE.equals(a.getAnswer()))
                .map(a -> a.getSurveyId())
                .collect(Collectors.toList());

        List<Document> additionalDocuments = surveyDocumentRepository
                .findBySurveyIdInAndAnswerTrue(trueSurveyIds)
                .stream()
                .map(SurveyDocument::getDocument)
                .collect(Collectors.toList());

        List<String> documentSummary = commonDocuments.stream()
                .map(Document::getName)
                .collect(Collectors.toList());
        additionalDocuments.stream()
                .map(Document::getName)
                .forEach(documentSummary::add);

        List<ChecklistResponseDto.StepDto> steps = checklistStepRepository
                .findByLicenseIndustryIdOrderByOrderNumAsc(licenseIndustry.getId())
                .stream()
                .map(step -> ChecklistResponseDto.StepDto.builder()
                        .orderNum(step.getOrderNum())
                        .place(step.getPlace())
                        .task(step.getTask())
                        .estimatedDays(step.getEstimatedDays())
                        .documents(documentSummary)
                        .build())
                .collect(Collectors.toList());

        return ChecklistResponseDto.builder()
                .industryName(licenseIndustry.getName())
                .licenseType(licenseIndustry.getLicenseType())
                .steps(steps)
                .documentSummary(documentSummary)
                .build();
    }

    @Override
    public void updateStep(UUID progressId, ChecklistProgressDto request) {
        ChecklistProgress progress = checklistProgressRepository.findById(progressId)
                .orElseThrow(() -> new RuntimeException("진행 중인 체크리스트를 찾을 수 없습니다."));

        progress.setCurrentStep(request.getCurrentStep());
        progress.setUpdatedAt(java.time.OffsetDateTime.now());
        checklistProgressRepository.save(progress);
    }
}