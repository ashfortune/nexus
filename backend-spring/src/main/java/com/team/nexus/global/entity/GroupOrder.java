package com.team.nexus.global.entity;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "group_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupOrder {

    @Id
    @Column(name = "id", length = 50, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gp_id", nullable = false)
    private GroupPurchase groupPurchase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "order_count")
    private Integer orderCount;

    @Column(name = "total_price", nullable = false)
    private Integer totalPrice;

    @Column(name = "pg_provider", length = 20)
    private String pgProvider;

    @Column(name = "pg_tid", length = 200)
    private String pgTid;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "payment_status", length = 20)
    private String paymentStatus;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}