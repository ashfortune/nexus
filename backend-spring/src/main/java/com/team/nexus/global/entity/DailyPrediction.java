package com.team.nexus.global.entity;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "daily_predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyPrediction {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prediction_id", nullable = false)
    private Prediction prediction;

    @Column(name = "target_date", nullable = false)
    private LocalDateTime targetDate;

    @Column(name = "pred_sales")
    private Integer predSales;

    @Column(name = "actual_sales")
    private Integer actualSales;

    @Column(name = "moving_average")
    private Double movingAverage;

    @Column(name = "return_rate")
    private Double returnRate;
}