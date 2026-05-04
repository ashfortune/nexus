package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "checklist_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChecklistStep {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "license_id", nullable = false)
    private LicenseIndustry licenseIndustry;

    @Column(name = "order_num", nullable = false)
    private Short orderNum;

    @Column(name = "place", nullable = false, length = 100)
    private String place;

    @Column(name = "task", nullable = false, length = 300)
    private String task;

    @Column(name = "estimated_days", length = 50)
    private String estimatedDays;
}
