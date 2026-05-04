package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "industry_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IndustryCategory {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private IndustryCategory parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    private List<IndustryCategory> children = new ArrayList<>();

    @Column(name = "level", nullable = false)
    private Short level;

    @Column(name = "ksic_code", length = 20)
    private String ksicCode;

    @Transient
    @Column(name = "embedding", columnDefinition = "vector(768)")
    private double[] embedding;

    @Column(name = "created_at", insertable = false, updatable = false)
    private java.time.LocalDateTime createdAt;
}
