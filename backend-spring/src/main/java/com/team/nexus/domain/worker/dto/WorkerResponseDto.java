package com.team.nexus.domain.worker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkerResponseDto {
    private WeeklyAllowance weeklyAllowance;
    private BreakTime breakTime;
    private Insurance insurance;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyAllowance {
        private boolean applicable;
        private int amount;
        private String reason;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BreakTime {
        private boolean required;
        private String duration;
        private String reason;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Insurance {
        private boolean required;
        private String[] types;
        private String reason;
    }
}
