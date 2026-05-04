package com.team.nexus.domain.mypage.dto;

import lombok.*;
import java.util.List;
import java.time.LocalDateTime;

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
        private LocalDateTime createdAt;
    }

    @Data @Builder
    public static class MyCommentDto {
        private String id;
        private String content;
        private String boardTitle;
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
