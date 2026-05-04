package com.team.nexus.domain.chat.dto;

import com.team.nexus.global.entity.ChatMessage;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponseDto {
    private UUID roomId;
    private UUID senderId;
    private String senderNickname;
    private String senderProfileImageUrl;
    private String message;
    private ChatMessage.MessageType type;
    private String fileUrl;
    private String fileName;
    private LocalDateTime createdAt;
}
