package com.team.nexus.domain.worker.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class WorkerRequestDto {
    private int employeeCount;
    private double dailyWorkHours;
    private int weeklyWorkDays;
    private int hourlyWage;
    private String employeeType;
}
