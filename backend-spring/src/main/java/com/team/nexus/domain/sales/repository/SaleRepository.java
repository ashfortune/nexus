package com.team.nexus.domain.sales.repository;

import com.team.nexus.global.entity.Sale;
import com.team.nexus.global.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SaleRepository extends JpaRepository<Sale, UUID> {
    Optional<Sale> findByUserAndSalesDate(User user, LocalDate salesDate);
}
