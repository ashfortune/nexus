package com.team.nexus.domain.grouppurchase.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupPurchaseRequestDto {
    private String title;
    private String itemName;
    private Integer itemPrice;
    private Integer targetCount;

    @com.fasterxml.jackson.annotation.JsonFormat(shape = com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm")
    private LocalDateTime endDate;

    private String description;
    private String imageUrl;
    private String region;
}
