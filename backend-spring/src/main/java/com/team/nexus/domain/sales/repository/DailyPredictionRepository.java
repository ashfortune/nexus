package com.team.nexus.domain.sales.repository;

import com.team.nexus.global.entity.DailyPrediction;
import com.team.nexus.global.entity.Prediction;
import com.team.nexus.global.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DailyPredictionRepository extends JpaRepository<DailyPrediction, UUID> {
    // 특정 분석 결과(Prediction)에 속한 모든 상세 데이터 조회
    List<DailyPrediction> findAllByPredictionOrderByTargetDateAsc(Prediction prediction);
}
