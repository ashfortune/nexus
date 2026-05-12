package com.team.nexus.domain.mypage.admin.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AdminDashboardDto {
    private List<UserSummaryDto> users;
    private List<BoardSummaryDto> boards;
    private List<CommentSummaryDto> comments;
    private List<PurchaseSummaryDto> purchases;
    private List<ChatRoomSummaryDto> chatRooms;

    @Getter
    @Builder
    public static class UserSummaryDto {
        private String id;
        private String email;
        private String nickname;
        private Integer userType;
        private Integer loginType;
        private String bizNo;
        private LocalDateTime createdAt;
        private Boolean isSuspended;
        private Boolean isWithdrawn;
    }

    @Getter
    @Builder
    public static class BoardSummaryDto {
        private String id;
        private String title;
        private String authorNickname;
        private String boardType;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    public static class CommentSummaryDto {
        private String id;
        private String content;
        private String authorNickname;
        private String boardTitle;
        private String boardId;
        private String boardType;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    public static class PurchaseSummaryDto {
        private String id;
        private String title;
        private String status;
        private Integer currentCount;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    public static class ChatRoomSummaryDto {
        private String id;
        private String title;
        private String creatorNickname;
        private LocalDateTime createdAt;
    }
}
