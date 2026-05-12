package com.team.nexus.domain.worker.service;

import com.team.nexus.domain.worker.dto.WorkerRequestDto;
import com.team.nexus.domain.worker.dto.WorkerResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WorkerServiceImpl implements WorkerService {

    @Override
    public WorkerResponseDto calculate(WorkerRequestDto request) {
        double scheduledWeeklyHours = request.getDailyWorkHours() * request.getWeeklyWorkDays();
        boolean over5Employees = request.getEmployeeCount() >= 5;

        return WorkerResponseDto.builder()
                .weeklyAllowance(calculateWeeklyAllowance(scheduledWeeklyHours, request.getHourlyWage()))
                .breakTime(calculateBreakTime(request.getDailyWorkHours()))
                .insurance(calculateInsurance(scheduledWeeklyHours))
                .build();
    }

    private WorkerResponseDto.WeeklyAllowance calculateWeeklyAllowance(
            double scheduledWeeklyHours, int hourlyWage) {

        if (scheduledWeeklyHours < 15) {
            return WorkerResponseDto.WeeklyAllowance.builder()
                    .applicable(false)
                    .amount(0)
                    .weeklyAllowanceHours(0)
                    .reason("주 15시간 미만 근무 시 주휴수당 미발생")
                    .build();
        }

        double weeklyAllowanceHours;
        String reason;

        if (scheduledWeeklyHours >= 40) {
            weeklyAllowanceHours = 8.0;
            reason = "주 40시간 이상 근무: 시급 × 8시간";
        } else {
            weeklyAllowanceHours = scheduledWeeklyHours / 5.0;
            reason = String.format(
                    "파트타임 비례계산: %.1f시간(주 소정근로) ÷ 5 = %.2f시간",
                    scheduledWeeklyHours, weeklyAllowanceHours
            );
        }

        int amount = (int) Math.floor(weeklyAllowanceHours * hourlyWage);

        return WorkerResponseDto.WeeklyAllowance.builder()
                .applicable(true)
                .amount(amount)
                .weeklyAllowanceHours(weeklyAllowanceHours)
                .reason(reason)
                .build();
    }

    private WorkerResponseDto.BreakTime calculateBreakTime(double dailyWorkHours) {
        if (dailyWorkHours >= 8) {
            return WorkerResponseDto.BreakTime.builder()
                    .required(true)
                    .duration("1시간")
                    .reason("8시간 이상 근무 시 1시간 휴게시간 부여 의무")
                    .build();
        } else if (dailyWorkHours >= 4) {
            return WorkerResponseDto.BreakTime.builder()
                    .required(true)
                    .duration("30분")
                    .reason("4시간 이상 근무 시 30분 휴게시간 부여 의무")
                    .build();
        }
        return WorkerResponseDto.BreakTime.builder()
                .required(false)
                .duration("없음")
                .reason("4시간 미만 근무 시 휴게시간 의무 없음")
                .build();
    }

    private WorkerResponseDto.Insurance calculateInsurance(double weeklyWorkHours) {
        if (weeklyWorkHours >= 15) {
            return WorkerResponseDto.Insurance.builder()
                    .required(true)
                    .types(new String[]{"국민연금", "건강보험", "고용보험", "산재보험"})
                    .reason("주 15시간 이상 근무 시 4대보험 가입 의무")
                    .build();
        }
        return WorkerResponseDto.Insurance.builder()
                .required(true)
                .types(new String[]{"산재보험"})
                .reason("주 15시간 미만 근무 시 산재보험만 의무")
                .build();
    }
}