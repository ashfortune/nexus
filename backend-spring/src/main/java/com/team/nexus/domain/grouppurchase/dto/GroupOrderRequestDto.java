package com.team.nexus.domain.grouppurchase.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupOrderRequestDto {
    private String pgProvider; // TOSS, KAKAO_PAY
    private String paymentMethod;
    private String pgTid;
    private Integer orderCount;
}
