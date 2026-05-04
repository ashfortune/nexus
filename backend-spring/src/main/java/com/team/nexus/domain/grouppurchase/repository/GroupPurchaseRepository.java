package com.team.nexus.domain.grouppurchase.repository;

import com.team.nexus.global.entity.GroupPurchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface GroupPurchaseRepository extends JpaRepository<GroupPurchase, UUID> {
    List<GroupPurchase> findAllByStatusAndEndDateBefore(String status, LocalDateTime now);

    @org.springframework.data.jpa.repository.Query("SELECT gp FROM GroupPurchase gp ORDER BY " +
            "CASE WHEN gp.endDate > CURRENT_TIMESTAMP AND (gp.status = 'RECRUITING') THEN 0 ELSE 1 END ASC, " +
            "gp.endDate ASC")
    List<GroupPurchase> findAllCustomSorted();

    List<GroupPurchase> findAllByEndDateBefore(LocalDateTime dateTime);

    @org.springframework.data.jpa.repository.Query("SELECT gp FROM GroupPurchase gp WHERE " +
            "(:itemName IS NULL OR gp.itemName LIKE %:itemName%) AND " +
            "(:region IS NULL OR gp.region LIKE %:region%) " +
            "ORDER BY CASE WHEN gp.endDate > CURRENT_TIMESTAMP AND (gp.status = 'RECRUITING') THEN 0 ELSE 1 END ASC, " +
            "gp.endDate ASC")
    List<GroupPurchase> searchGroupPurchases(
            @org.springframework.data.repository.query.Param("itemName") String itemName,
            @org.springframework.data.repository.query.Param("region") String region
    );
}
