package com.team.nexus.domain.grouppurchase.repository;

import com.team.nexus.global.entity.GroupOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GroupOrderRepository extends JpaRepository<GroupOrder, String> {
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(go) > 0 FROM GroupOrder go WHERE go.groupPurchase.id = :gpId AND go.user.id = :userId")
    boolean existsByGroupPurchaseIdAndUserId(@org.springframework.data.repository.query.Param("gpId") UUID gpId, @org.springframework.data.repository.query.Param("userId") UUID userId);
    
    List<GroupOrder> findAllByGroupPurchaseId(UUID gpId);
}
