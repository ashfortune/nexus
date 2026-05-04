package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "brand_identities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrandIdentity {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branding_id", nullable = false)
    private Branding branding;

    @Column(name = "brand_name", nullable = false, length = 100)
    private String brandName;

    @Column(name = "slogan")
    private String slogan;

    @Column(name = "brand_story", columnDefinition = "text")
    private String brandStory;

    @Column(name = "is_selected")
    private Boolean isSelected;

    // Vector type (embedding) is skipped for now. Using @Transient to prevent Hibernate mapping errors.
    @Transient
    private double[] embedding;
}
