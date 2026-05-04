package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "subsidies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subsidy {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "organization", nullable = false, length = 100)
    private String organization;

    @Column(name = "max_amount", length = 50)
    private String maxAmount;

    @Column(name = "deadline", length = 50)
    private String deadline;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "eligibility", columnDefinition = "text")
    private String eligibility;

    @Column(name = "apply_url", length = 500)
    private String applyUrl;

    @Column(name = "embedding", columnDefinition = "vector")
    private double[] embedding;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private java.time.LocalDateTime updatedAt;
}
