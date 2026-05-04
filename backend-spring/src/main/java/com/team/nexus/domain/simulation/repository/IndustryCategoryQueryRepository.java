package com.team.nexus.domain.simulation.repository;

import com.team.nexus.global.entity.IndustryCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IndustryCategoryQueryRepository extends JpaRepository<IndustryCategory, UUID> {
    @Query("SELECT cat.name FROM IndustryCategory cat WHERE cat.ksicCode = :ksicCode")
    String findNameByKsicCode(@Param("ksicCode") String ksicCode);

    @Query("SELECT cat.id FROM IndustryCategory cat WHERE cat.ksicCode = :ksicCode")
    UUID findIdByKsicCode(@Param("ksicCode") String ksicCode);

    Optional<IndustryCategory> findFirstByKsicCode(String ksicCode);
}
