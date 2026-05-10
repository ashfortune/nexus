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
        try {
            log.info("Requesting AI Match via FastAPI for user: {}", reqDto.getUserId());
            
            // FastAPI 호출 (user_id 포함)
            Map fastApiResponse = expertAiClient.requestExpertMatch(
                reqDto.getUserId(),
                reqDto.getIndustryCategoryId(),
                reqDto.getRequestContent()
            ).block();

            if (fastApiResponse == null) {
                return createEmptyResponse(null);
            }

            log.info("AI Server Match Result: {}", fastApiResponse);

            // 결과 매핑
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.List<Map<String, Object>> matches = mapper.convertValue(
                    fastApiResponse.get("matches"), 
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.List<Map<String, Object>>>() {}
            );

            java.util.List<ExpertMatchResDto.MatchedExpertInfo> expertList = new java.util.ArrayList<>();
            for (Map<String, Object> m : matches) {
                expertList.add(ExpertMatchResDto.MatchedExpertInfo.builder()
                        .matchedExpertId(UUID.fromString(String.valueOf(m.get("matched_expert_id"))))
                        .expertName(String.valueOf(m.get("expert_name")))
                        .expertPhone(String.valueOf(m.get("expert_phone")))
                        .expertPortfolio(String.valueOf(m.get("portfolio")))
                        .matchReason(String.valueOf(m.get("match_reason")))
                        .rating(m.get("rating") != null ? Double.valueOf(String.valueOf(m.get("rating"))) : 5.0)
                        .build());
            }

            return ExpertMatchResDto.builder()
                    .matchRequestId(UUID.fromString(String.valueOf(fastApiResponse.get("match_request_id"))))
                    .experts(expertList)
                    .build();

        } catch (Exception e) {
            log.error("Expert Match Proxy Error: {}", e.getMessage(), e);
            return createEmptyResponse(null);
        }
    }

    private ExpertMatchResDto createEmptyResponse(UUID requestId) {
        return ExpertMatchResDto.builder()
                .matchRequestId(requestId)
                .experts(new java.util.ArrayList<>())
                .build();
    }
}
