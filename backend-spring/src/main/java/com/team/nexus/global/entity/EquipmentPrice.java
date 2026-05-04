package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "equipment_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentPrice {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "industry_category_id")
    private IndustryCategory industryCategory;

    @Column(name = "equipment_kr")
    private String equipment_kr;

    @Column(name = "equipment_eng")
    private String equipment_eng;

    @Column(name = "product_name")
    private String product_name;

    @Column(name = "price")
    private Integer price;

    @Column(name = "detail")
    private String detail;

    @Column(name = "link", length = 500)
    private String link;

    @Column(name = "image_url", length = 500)
    private String image_url;
    // "NAVER", "LLM_NAVER_FIX", "RAG", "LLM"
    @Column(name = "source")
    private String source;
}
