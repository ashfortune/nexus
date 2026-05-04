package com.team.nexus.global.entity;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prediction {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "base_date", nullable = false)
    private LocalDateTime baseDate;

    @Column(name = "total_sales")
    private Integer totalSales;

    @Column(name = "predicted_cost")
    private Integer predictedCost;

    @Column(name = "moving_average")
    private Double movingAverage;

    @Column(name = "return_rate")
    private Double returnRate;

    @OneToMany(mappedBy = "prediction", cascade = CascadeType.ALL)
    private List<DailyPrediction> dailyPredictions = new ArrayList<>();

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}