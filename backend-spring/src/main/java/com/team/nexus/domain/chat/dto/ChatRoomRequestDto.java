package com.team.nexus.domain.chat.dto;

import com.team.nexus.global.entity.ChatRoom;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ChatRoomRequestDto {
    private String title;
    private ChatRoom.ChatRoomType type;
    private String description;
    private String imageUrl;
    private UUID creatorId;
    private String password;
}
