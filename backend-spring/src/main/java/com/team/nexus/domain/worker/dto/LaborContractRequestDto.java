package com.team.nexus.domain.worker.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class LaborContractRequestDto {
    private String contractType;      // 계약서 유형
    private String employerName;      // 사업주명
    private String employerPhone;     // 사업주 전화
    private String employerAddress;   // 사업주 주소
    private String representativeName; // 대표자명
    private String workerName;        // 근로자명
    private String workerAddress;     // 근로자 주소
    private String workerPhone;       // 근로자 연락처
    private String startDate;         // 근로개시일
    private String endDate;           // 종료일
    private String workplace;         // 근무장소
    private String jobDescription;    // 업무내용
    private String workStartTime;     // 업무 시작시간
    private String workEndTime;       // 업무 종료시간
    private String breakStartTime;    // 휴게 시작시간
    private String breakEndTime;      // 휴게 종료시간
    private String dailyWorkHours;    // 1일 근로시간
    private String weeklyWorkHours;   // 1주 근로시간
    private String weeklyWorkDays;    // 주 근무일수
    private String weeklyHoliday;     // 주휴일
    private String wage;              // 임금
    private String wageType;          // 임금 유형
    private Boolean hasBonus;         // 상여금 여부
    private String bonusAmount;       // 상여금 금액
    private Boolean hasExtraAllowance; // 기타수당 여부
    private String paymentDay;        // 임금지급일
    private String paymentMethod;     // 지급방법
    private String contractDate;      // 작성일
}