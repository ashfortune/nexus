package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "checklist_progresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistProgress {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "license_id", nullable = false)
    private LicenseIndustry licenseIndustry;

    @Column(name = "current_step", nullable = false)
    private Short currentStep;

    @Column(name = "industry_code", length = 50)
    private String industryCode;

    @Column(name = "conditions", columnDefinition = "jsonb")
    private String conditions;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}