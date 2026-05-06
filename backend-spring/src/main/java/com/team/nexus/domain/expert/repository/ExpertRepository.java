package com.team.nexus.domain.expert.repository;

import com.team.nexus.global.entity.Expert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ExpertRepository extends JpaRepository<Expert, UUID> {
}
