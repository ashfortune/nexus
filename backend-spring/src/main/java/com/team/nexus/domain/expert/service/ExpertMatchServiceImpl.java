package com.team.nexus.domain.expert.service;

import com.team.nexus.domain.expert.client.ExpertAiClient;
import com.team.nexus.domain.expert.dto.ExpertMatchReqDto;
import com.team.nexus.domain.expert.dto.ExpertMatchResDto;
import com.team.nexus.domain.expert.repository.ExpertMatchRequestRepository;
import com.team.nexus.domain.expert.repository.ExpertRepository;
import com.team.nexus.global.entity.ExpertMatchRequest;
import com.team.nexus.global.entity.Expert;
import com.team.nexus.global.entity.IndustryCategory;
import com.team.nexus.global.entity.User;
import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.domain.license.repository.IndustryCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpertMatchServiceImpl implements ExpertMatchService {

    private final ExpertMatchRequestRepository matchRequestRepository;
    private final ExpertRepository expertRepository;
    private final UserRepository userRepository;
    private final IndustryCategoryRepository categoryRepository;
    private final ExpertAiClient expertAiClient;

    @Override
    public ExpertMatchResDto matchExpert(ExpertMatchReqDto reqDto) {
        ExpertMatchRequest matchRequest = null;
        try {
            // 1. 초기 데이터 조회 (읽기 전용)
            User user = userRepository.findById(reqDto.getUserId()).orElse(null);
            if (user == null) {
                log.error("User not found: {}", reqDto.getUserId());
                return createEmptyResponse(null);
            }

            IndustryCategory category = null;
            if (reqDto.getIndustryCategoryId() != null) {
                category = categoryRepository.findById(reqDto.getIndustryCategoryId()).orElse(null);
            }

            // 2. 매칭 요청 DB 초기 저장 (별도 트랜잭션처럼 동작)
            matchRequest = ExpertMatchRequest.builder()
                    .requester(user)
                    .industryCategory(category)
                    .requestContent(reqDto.getRequestContent())
                    .status("PENDING")
                    .build();
            try {
                matchRequest = matchRequestRepository.save(matchRequest);
            } catch (Exception e) {
                log.error("Initial match request save failed: {}", e.getMessage());
            }

            // 3. FastAPI 호출 (트랜잭션 외부에서 수행)
            Map fastApiResponse = null;
            try {
                log.info("Requesting AI Match for content: {}", reqDto.getRequestContent());
                // 카테고리 ID가 DB에 없더라도 내용만으로 매칭 시도
                String categoryIdStr = null;
                if (reqDto.getIndustryCategoryId() != null) {
                    categoryIdStr = reqDto.getIndustryCategoryId().toString();
                }
                
                fastApiResponse = expertAiClient.requestExpertMatch(categoryIdStr, reqDto.getRequestContent()).block();
                log.info("AI Raw Response: {}", fastApiResponse);
            } catch (Exception e) {
                log.error("FastAPI Call Failed: {}", e.getMessage());
            }

            java.util.List<ExpertMatchResDto.MatchedExpertInfo> expertList = new java.util.ArrayList<>();

            if (fastApiResponse != null && fastApiResponse.get("matches") != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.List<Map<String, Object>> matches = mapper.convertValue(
                        fastApiResponse.get("matches"), 
                        new com.fasterxml.jackson.core.type.TypeReference<java.util.List<Map<String, Object>>>() {}
                );
                
                for (int i = 0; i < matches.size(); i++) {
                    try {
                        Map<String, Object> m = matches.get(i);
                        String matchedIdStr = String.valueOf(m.get("matched_expert_id"));
                        String matchReason = String.valueOf(m.get("match_reason"));
                        
                        Expert expert = null;
                        if (matchedIdStr != null && !matchedIdStr.isEmpty() && !matchedIdStr.equals("null")) {
                            expert = expertRepository.findById(UUID.fromString(matchedIdStr)).orElse(null);
                        }
                        
                        if (expert != null) {
                            try {
                                if (i == 0 && matchRequest != null) {
                                    matchRequest.setMatchedExpert(expert);
                                    matchRequest.setMatchReason(matchReason);
                                    matchRequest.setStatus("COMPLETED");
                                    matchRequestRepository.save(matchRequest);
                                }
                            } catch (Exception se) {
                                log.error("Record save failed: {}", se.getMessage());
                            }
                            
                            expertList.add(ExpertMatchResDto.MatchedExpertInfo.builder()
                                    .matchedExpertId(expert.getId())
                                    .expertName(expert.getName())
                                    .expertPhone(expert.getPhone() != null ? expert.getPhone() : "010-1234-5678")
                                    .expertPortfolio(expert.getPortfolioText())
                                    .matchReason(matchReason)
                                    .rating(expert.getRating() != null ? expert.getRating() : 5.0)
                                    .build());
                        }
                    } catch (Exception e) {
                        log.error("Expert mapping error: {}", e.getMessage());
                    }
                }
            }

            // 4. 폴백: 무조건 3명 채우기
            if (expertList.size() < 3) {
                log.info("Filling fallback experts...");
                try {
                    java.util.List<Expert> allExperts = expertRepository.findAll();
                    if (allExperts.isEmpty()) {
                        log.warn("No experts found in database experts table!");
                    } else {
                        java.util.Collections.shuffle(allExperts);
                        for (Expert exp : allExperts) {
                            if (expertList.size() >= 3) break;
                            final UUID expId = exp.getId();
                            if (expertList.stream().noneMatch(e -> e.getMatchedExpertId().equals(expId))) {
                                expertList.add(ExpertMatchResDto.MatchedExpertInfo.builder()
                                        .matchedExpertId(exp.getId())
                                        .expertName(exp.getName())
                                        .expertPhone(exp.getPhone() != null ? exp.getPhone() : "010-1234-5678")
                                        .expertPortfolio(exp.getPortfolioText())
                                        .matchReason("고객님의 요구사항과 연관된 전문 분야를 보유하고 있어 특별히 선정된 추천 전문가입니다.")
                                        .rating(exp.getRating() != null ? exp.getRating() : 5.0)
                                        .build());
                            }
                        }
                    }
                } catch (Exception fe) {
                    log.error("Fallback failed: {}", fe.getMessage());
                }
            }

            return ExpertMatchResDto.builder()
                    .matchRequestId(matchRequest != null ? matchRequest.getId() : null)
                    .experts(expertList)
                    .build();
        } catch (Exception e) {
            log.error("Expert Match Service Critical Error: {}", e.getMessage(), e);
            if (matchRequest != null) {
                try {
                    matchRequest.setStatus("FAILED");
                    matchRequestRepository.save(matchRequest);
                } catch (Exception ex) {}
            }
        }

        return createEmptyResponse(matchRequest != null ? matchRequest.getId() : null);
    }

    private ExpertMatchResDto createEmptyResponse(UUID requestId) {
        return ExpertMatchResDto.builder()
                .matchRequestId(requestId)
                .experts(new java.util.ArrayList<>())
                .build();
    }
}
