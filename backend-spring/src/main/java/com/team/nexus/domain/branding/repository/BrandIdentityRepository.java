package com.team.nexus.domain.branding.repository;

import com.team.nexus.domain.branding.dto.BrandIdentityDto;
import com.team.nexus.global.entity.BrandIdentity;
import com.team.nexus.global.entity.Branding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BrandIdentityRepository extends JpaRepository<BrandIdentity, UUID> {
    List<BrandIdentity> findByBranding(Branding branding);

    @Query("SELECT new com.team.nexus.domain.branding.dto.BrandIdentityDto(bi.id, bi.brandName, bi.slogan, bi.brandStory, bi.isSelected) " +
           "FROM BrandIdentity bi WHERE bi.branding.id = :brandingId")
    List<BrandIdentityDto> findDtoByBrandingId(@Param("brandingId") UUID brandingId);

    List<BrandIdentity> findByBrandingId(UUID brandingId);
}
