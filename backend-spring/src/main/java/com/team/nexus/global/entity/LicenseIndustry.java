package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "license_industries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LicenseIndustry {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "law_name", nullable = false, length = 200)
    private String lawName;

    @Column(name = "law_article", length = 100)
    private String lawArticle;

    @Column(name = "license_type", nullable = false, length = 20)
    private String licenseType;

    @Column(name = "department", nullable = false, length = 100)
    private String department;
}
