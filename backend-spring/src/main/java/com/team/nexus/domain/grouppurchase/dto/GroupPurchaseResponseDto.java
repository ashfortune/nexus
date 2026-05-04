package com.team.nexus.domain.grouppurchase.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupPurchaseResponseDto {
    private UUID id;
    private String title;
    private String itemName;
    private Integer itemPrice;
    private Integer targetCount;
    private Integer currentCount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private String description;
    private String imageUrl;
    private String region;
    private String creatorNickname;
    private UUID creatorId;
}
