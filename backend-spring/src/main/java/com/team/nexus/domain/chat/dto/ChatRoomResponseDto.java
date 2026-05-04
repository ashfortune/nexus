package com.team.nexus.domain.chat.dto;

import com.team.nexus.global.entity.ChatRoom;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class ChatRoomResponseDto {
    private UUID id;
    private String title;
    private String description;
    private String imageUrl;
    private ChatRoom.ChatRoomType type;
    private UUID creatorId;
    private String creatorNickname;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private LocalDateTime createdAt;
    private Long participantCount;
    private Boolean hasPassword;
}
