package com.team.nexus.domain.board.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardCreateRequestDto {
    private String title;
    private String content;
    private String regionName;
    private String categoryName;
    private Boolean isAnonymous;
    private List<String> imageUrls;
    private String industryCategoryId;
}
