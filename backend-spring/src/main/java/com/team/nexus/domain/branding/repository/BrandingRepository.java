package com.team.nexus.domain.branding.repository;

import com.team.nexus.global.entity.Branding;
import com.team.nexus.global.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BrandingRepository extends JpaRepository<Branding, UUID> {
    List<Branding> findByUser(User user);
    List<Branding> findByUserId(UUID userId);
}
