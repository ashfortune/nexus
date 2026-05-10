package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "experts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expert {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "phone", length = 20)
    private String phone;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "industry_category_id")
    private IndustryCategory industryCategory;

    @Column(name = "portfolio_text", columnDefinition = "TEXT")
    private String portfolioText;

    private Double rating;

    // Vector type handling might require custom types or just string/json if not using pgvector features from Spring Data directly
    // For now, we mainly use it for display and matching via FastAPI, so we don't necessarily need the embedding field mapped here 
    // unless we do vector searches in Spring Boot.
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
