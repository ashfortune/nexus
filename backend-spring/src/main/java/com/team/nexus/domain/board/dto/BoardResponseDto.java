package com.team.nexus.domain.board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardResponseDto {
    private UUID id;
    private String title;
    private String author;
    private UUID authorId; // Added for ownership check
    private String content;
    private List<String> imageUrls;
    private String regionName;
    private String categoryName;
    private String industryCategoryId;
    private String industryCategoryName;
    private LocalDateTime createdAt;
    private Integer viewCount;
    private Integer likeCount;
    private Long commentCount;
}
