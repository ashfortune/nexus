package com.team.nexus.domain.mypage.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyPageResponseDto {
    private String email;
    private String nickname;
    private Integer userType;
    private String bizNo;
    private String provider;
    private String profileImage;
    private List<MyPostDto> posts;
    private List<MyCommentDto> comments;
    private List<MyPurchaseDto> purchases;

    @Data @Builder
    public static class MyPostDto {
        private String id;
        private String title;
        private String boardType; // board, region-board, industry-board
        private LocalDateTime createdAt;
    }

    @Data @Builder
    public static class MyCommentDto {
        private String id;
        private String content;
        private String boardId;
        private String boardTitle;
        private String boardType; // board, region-board, industry-board
        private LocalDateTime createdAt;
    }

    @Data @Builder
    public static class MyPurchaseDto {
        private String id;
        private String title;
        private String status;
        private LocalDateTime createdAt;
    }
}
