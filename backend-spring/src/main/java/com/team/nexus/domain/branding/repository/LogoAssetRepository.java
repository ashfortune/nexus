package com.team.nexus.domain.branding.repository;

import com.team.nexus.global.entity.BrandIdentity;
import com.team.nexus.global.entity.LogoAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LogoAssetRepository extends JpaRepository<LogoAsset, UUID> {
    List<LogoAsset> findByBrandIdentity(BrandIdentity brandIdentity);
    List<LogoAsset> findByBrandIdentityId(UUID brandIdentityId);

    @Query("SELECT l.imageUrl FROM LogoAsset l " +
           "JOIN l.brandIdentity bi " +
           "WHERE bi.branding.id = :brandingId " +
           "AND bi.isSelected = true " +
           "AND l.isFinal = true")
    List<String> findFinalLogoUrlByBrandingId(@Param("brandingId") UUID brandingId);
}
