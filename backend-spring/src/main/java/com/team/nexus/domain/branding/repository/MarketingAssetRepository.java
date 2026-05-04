package com.team.nexus.domain.branding.repository;

import com.team.nexus.global.entity.BrandIdentity;
import com.team.nexus.global.entity.MarketingAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface MarketingAssetRepository extends JpaRepository<MarketingAsset, UUID> {
    List<MarketingAsset> findByBrandIdentity(BrandIdentity brandIdentity);
    List<MarketingAsset> findByBrandIdentityId(UUID brandIdentityId);
}
