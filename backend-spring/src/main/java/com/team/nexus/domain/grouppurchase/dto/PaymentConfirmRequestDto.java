package com.team.nexus.domain.grouppurchase.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PaymentConfirmRequestDto {
    private String paymentKey;
    private String orderId;
    private Integer amount;
}
