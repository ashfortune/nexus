package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "semas_industry_mappings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemasIndustryMapping {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "semas_ksic_code", length = 20)
    private String semasKsicCode;

    @Column(name = "ksic_code", length = 20)
    private String ksicCode;

    @Column(name = "large_category_name", length = 100)
    private String largeCategoryName;

    @Column(name = "medium_category_name", length = 100)
    private String mediumCategoryName;

    @Column(name = "small_category_name", length = 100)
    private String smallCategoryName;
}
