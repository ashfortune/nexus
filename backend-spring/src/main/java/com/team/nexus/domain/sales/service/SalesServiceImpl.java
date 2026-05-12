package com.team.nexus.domain.sales.service;

import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.domain.sales.dto.SalesDataDTO;
import com.team.nexus.domain.sales.repository.DailyPredictionRepository;
import com.team.nexus.domain.sales.repository.PredictionRepository;
import com.team.nexus.domain.sales.repository.SaleRepository;
import com.team.nexus.global.entity.DailyPrediction;
import com.team.nexus.global.entity.Prediction;
import com.team.nexus.global.entity.Sale;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SalesServiceImpl implements SalesService {

    private final SaleRepository saleRepository;
    private final UserRepository userRepository;
    private final com.team.nexus.client.FastApiClient fastApiClient;
    private final PredictionRepository predictionRepository;
    private final DailyPredictionRepository dailyPredictionRepository;

    @Override
    public Map<String, Object> getLatestAnalysis(String userId) {
        log.info("최근 AI 분석 결과 조회 요청: userId={}", userId);
        
        UUID userUuid = UUID.fromString(userId);
        User user = userRepository.findById(userUuid)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        // 1. 최신 예측 결과 조회
        return predictionRepository.findFirstByUserOrderByCreatedAtDesc(user)
                .map(prediction -> {
                    Map<String, Object> data = new java.util.HashMap<>();
                    data.put("status", "success");
                    
                    Map<String, Object> result = new java.util.HashMap<>();
                    result.put("movingAverage", prediction.getMovingAverage());
                    result.put("returnRate", prediction.getReturnRate());
                    result.put("predictedSales", prediction.getPredictedCost());
                    
                    // 예측 상세 정보 (날짜 등)
                    Map<String, Object> predInfo = new java.util.HashMap<>();
                    predInfo.put("amount", prediction.getPredictedCost());
                    predInfo.put("date", prediction.getBaseDate() != null ? 
                        prediction.getBaseDate().toLocalDate().plusDays(1).toString() : "내일");
                    result.put("prediction", predInfo);

                    // 1.5. 추가 분석 요약 메타데이터 매핑 (프론트엔드 심층 분석 코멘트 영역 연동)
                    result.put("nextMonthForecast", prediction.getPredictedCost() != null ? prediction.getPredictedCost() * 30 : 0);
                    result.put("analysisReport", String.format(
                        "데이터베이스에 적재된 시계열 분석 결과 최신본입니다. 내일 예상 매출은 %,d원이며, 최근 7일 평균 대비 변동 추세는 %+.2f%%입니다.",
                        prediction.getPredictedCost(),
                        prediction.getReturnRate() != null ? prediction.getReturnRate() : 0.0
                    ));

                    // 2. 그래프용 상세 데이터 조회
                    List<Map<String, Object>> analysisData = new ArrayList<>();
                    List<DailyPrediction> dailyList = dailyPredictionRepository.findAllByPredictionOrderByTargetDateAsc(prediction);
                    
                    // 사용된 구체적인 AI/통계 모델 종류 분기 판별 및 매핑
                    boolean wasTimesFmUsed = dailyList.stream().anyMatch(dp -> dp.getTimesfmSales() != null);
                    long historicalDataSize = dailyList.stream().filter(dp -> dp.getActualSales() != null).count();
                    String predictionMethod = "Exponential Smoothing (Statsmodels)";
                    if (wasTimesFmUsed) {
                        predictionMethod = "TimesFM 2.5 (AI Foundation Model) - Local CPU";
                    } else if (historicalDataSize <= 30) {
                        predictionMethod = "Simple Moving Average";
                    }
                    result.put("predictionMethod", predictionMethod);

                    for (DailyPrediction dp : dailyList) {
                        Map<String, Object> row = new java.util.HashMap<>();
                        row.put("target_date", dp.getTargetDate().toLocalDate().toString());
                        row.put("date", dp.getTargetDate().toLocalDate().toString()); // 프론트엔드 호환용 키 추가!

                        // 하위 호환성 유지용 키
                        row.put("sales", dp.getActualSales());
                        row.put("predictedSales", dp.getPredSales());

                        // 새 통합 싱글 그래프 표준 스키마 키 명세
                        row.put("actual", dp.getActualSales());
                        row.put("predicted", dp.getPredSales());
                        row.put("timesfm", dp.getTimesfmSales());
                        row.put("movingAverage", dp.getMovingAverage());
                        row.put("returnRate", dp.getReturnRate());

                        analysisData.add(row);
                    }
                    result.put("analysisData", analysisData);
                    
                    data.put("data", result);
                    return data;
                })
                .orElseGet(() -> {
                    log.info("기존 분석 결과가 없습니다: userId={}", userId);
                    return Map.of("status", "no_data", "message", "아직 분석된 데이터가 없습니다. 먼저 매출 데이터를 저장해주세요.");
                });
    }

    @Override
    public Map<String, Object> triggerAnalysis(String userId) {
        log.info("AI 매출 분석 트리거 요청 시작: userId={}", userId);
        
        try {
            // FastApiClient를 통해 FastAPI 서버에 분석 지시
            Map result = fastApiClient.triggerSalesAnalysis(userId).block();
            log.info("FastAPI 분석 요청 성공: {}", result);
            return result != null ? result : Map.of("status", "error", "message", "분석 결과가 비어있습니다.");
        } catch (Exception e) {
            log.error("FastAPI 통신 중 오류 발생: {}", e.getMessage());
            return Map.of("status", "error", "message", "AI 서버와의 통신에 실패했습니다: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void saveOrUpdateSales(UUID userId, List<SalesDataDTO> dataList) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        log.info("매출 데이터 저장 시작: 사용자={}, 데이터 건수={}", userId, dataList.size());

        for (SalesDataDTO data : dataList) {
            if (data.getDate() == null) {
                log.warn("날짜 데이터가 누락되었습니다. 건너뜁니다: {}", data);
                continue;
            }

            LocalDate salesDate = data.getDate();
            
            // 덮어쓰기 로직: 기존 데이터 존재 여부 확인
            Sale sale = saleRepository.findByUserAndSalesDate(user, salesDate)
                    .orElseGet(() -> {
                        log.debug("새로운 매출 레코드 생성: {}", salesDate);
                        return new Sale();
                    });

            sale.setUser(user);
            sale.setSalesDate(salesDate);
            sale.setTotalAmount(data.getSales());
            sale.setStoreNumber("MANUAL_INPUT");
            
            log.debug("저장 전 Sale 객체 상태: user={}, date={}, amount={}", 
                sale.getUser().getId(), sale.getSalesDate(), sale.getTotalAmount());
            
            Sale saved = saleRepository.save(sale);
            log.debug("저장 완료된 Sale ID: {}", saved.getId());
        }
        log.info("매출 데이터 저장 프로세스 완료");
    }

    @Override
    public List<SalesDataDTO> parseCsv(MultipartFile file) {
        List<SalesDataDTO> dataList = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isHeader = true;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                
                String[] columns = line.split(",");
                if (columns.length < 2) continue;

                // 헤더 스킵 (첫 번째 행이 숫자가 아니면 헤더로 간주)
                if (isHeader) {
                    isHeader = false;
                    if (!columns[0].matches(".*\\d.*")) continue;
                }

                try {
                    LocalDate date = LocalDate.parse(columns[0].trim(), DateTimeFormatter.ISO_DATE);
                    Integer sales = Integer.parseInt(columns[1].trim());
                    dataList.add(new SalesDataDTO(date, sales));
                } catch (Exception e) {
                    log.warn("CSV 파싱 오류 (행 건너뜀): {}", line);
                }
            }
        } catch (Exception e) {
            log.error("CSV 파일 읽기 실패", e);
            throw new RuntimeException("CSV 파일 처리에 실패했습니다.");
        }
        return dataList;
    }
}
