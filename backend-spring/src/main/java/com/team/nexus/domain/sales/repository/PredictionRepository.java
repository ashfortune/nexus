package com.team.nexus.domain.sales.repository;

import com.team.nexus.global.entity.Prediction;
import com.team.nexus.global.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PredictionRepository extends JpaRepository<Prediction, UUID> {
    // 특정 사용자의 가장 최근 분석 결과 조회
    Optional<Prediction> findFirstByUserOrderByCreatedAtDesc(User user);
}
