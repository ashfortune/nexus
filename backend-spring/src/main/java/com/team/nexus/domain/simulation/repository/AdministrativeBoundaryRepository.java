package com.team.nexus.domain.simulation.repository;

import com.team.nexus.global.entity.AdministrativeBoundaries;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface AdministrativeBoundaryRepository extends JpaRepository<AdministrativeBoundaries, UUID> {

    List<AdministrativeBoundaries> findByAdmCdStartingWith(String admCdPrefix);

    List<AdministrativeBoundaries> findByAdmNmIn(Collection<String> admNmList);

    // prefix+이름 동시 필터 — 전국 동명이동 중복 방지
    List<AdministrativeBoundaries> findByAdmCdStartingWithAndAdmNmIn(String admCdPrefix, Collection<String> admNmList);

    // prefix별 샘플 데이터 1건 (centroid 근사용)
    @Query(value = """
            SELECT DISTINCT ON (LEFT(adm_cd, 5))
                   LEFT(adm_cd, 5) AS prefix,
                   boundary
            FROM   administrative_boundaries
            ORDER  BY LEFT(adm_cd, 5)
            """, nativeQuery = true)
    List<Object[]> findPrefixSamples();

    // 동 이름 세트로 매칭되는 prefix들과 그 개수 조회
    @Query(value = """
            SELECT LEFT(adm_cd, 5) AS prefix, COUNT(*) AS cnt
            FROM   administrative_boundaries
            WHERE  adm_nm IN :names
            GROUP  BY LEFT(adm_cd, 5)
            """, nativeQuery = true)
    List<Object[]> findPrefixCountsForNames(@Param("names") Collection<String> names);
}
