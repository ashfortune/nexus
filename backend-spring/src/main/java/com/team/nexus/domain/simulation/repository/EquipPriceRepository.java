package com.team.nexus.domain.simulation.repository;

import com.team.nexus.global.entity.EquipmentPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

// 레포지토리는 데이터 접근 로직
public interface EquipPriceRepository extends JpaRepository<EquipmentPrice, UUID> {
    List<EquipmentPrice> findByIndustryCategoryId(UUID industryCategoryId);

    long countByIndustryCategoryIdAndSource(UUID industryCategoryId, String source);
}
