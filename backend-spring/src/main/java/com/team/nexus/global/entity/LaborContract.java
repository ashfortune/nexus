package com.team.nexus.global.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "labor_contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LaborContract {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "employer_name", nullable = false, length = 100)
    private String employerName;

    @Column(name = "employee_name", nullable = false, length = 100)
    private String employeeName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "workplace", nullable = false, length = 200)
    private String workplace;

    @Column(name = "job_description", nullable = false, length = 300)
    private String jobDescription;

    @Column(name = "daily_work_hours", nullable = false)
    private Short dailyWorkHours;

    @Column(name = "weekly_work_days", nullable = false)
    private Short weeklyWorkDays;

    @Column(name = "hourly_wage", nullable = false)
    private Integer hourlyWage;

    @Column(name = "weekly_allowance")
    private Integer weeklyAllowance;

    @Column(name = "employee_type", nullable = false, length = 20)
    private String employeeType;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @Column(name = "created_at", insertable = false, updatable = false)
    private java.time.LocalDateTime createdAt;
}
