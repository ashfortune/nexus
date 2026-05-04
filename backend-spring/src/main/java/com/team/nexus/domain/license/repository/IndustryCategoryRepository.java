package com.team.nexus.domain.license.repository;

import com.team.nexus.global.entity.IndustryCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IndustryCategoryRepository extends JpaRepository<IndustryCategory, UUID> {

    List<IndustryCategory> findByParentIsNull();
    List<IndustryCategory> findByParentId(UUID parentId);
}
