package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.util.UUID;

@Entity
@Table(name = "expert_match_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpertMatchRequest {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "industry_category_id")
    private IndustryCategory industryCategory;

    @Column(name = "request_content", columnDefinition = "TEXT", nullable = false)
    private String requestContent;

    @Column(name = "status")
    private String status; // PENDING, MATCHED, COMPLETED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matched_expert_id")
    private Expert matchedExpert;

    @Column(name = "match_reason", columnDefinition = "TEXT")
    private String matchReason; // AI Generated Reason

    @Column(name = "created_at", insertable = false, updatable = false)
    private java.time.LocalDateTime createdAt;
}
