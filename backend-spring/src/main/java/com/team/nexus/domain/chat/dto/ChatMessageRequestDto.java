package com.team.nexus.domain.chat.dto;

import com.team.nexus.global.entity.ChatMessage;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageRequestDto {
    private UUID roomId;
    private UUID senderId;
    private String message;
    private ChatMessage.MessageType type;
    private String fileUrl;
    private String fileName;
}
