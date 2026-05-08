package com.team.nexus.domain.expert.repository;

import com.team.nexus.global.entity.ExpertMatchRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ExpertMatchRequestRepository extends JpaRepository<ExpertMatchRequest, UUID> {
}
