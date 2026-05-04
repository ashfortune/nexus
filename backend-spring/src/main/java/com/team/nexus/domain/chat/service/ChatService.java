package com.team.nexus.domain.chat.service;

import com.team.nexus.domain.chat.dto.ChatMessageRequestDto;
import com.team.nexus.domain.chat.dto.ChatMessageResponseDto;
import com.team.nexus.domain.chat.dto.ChatRoomResponseDto;
import com.team.nexus.global.entity.ChatRoom;

import java.util.List;
import java.util.UUID;

public interface ChatService {
    ChatRoomResponseDto createRoom(String title, ChatRoom.ChatRoomType type, String description, String imageUrl, UUID creatorId, String password);
    void joinRoom(UUID roomId, UUID userId, String password);
    ChatMessageResponseDto saveMessage(ChatMessageRequestDto messageDto);
    List<ChatMessageResponseDto> getMessages(UUID roomId, UUID userId);
    List<ChatRoomResponseDto> getAllRooms();
    void leaveRoom(UUID roomId, UUID userId);
    List<ChatRoomResponseDto> getJoinedRooms(UUID userId);
    List<com.team.nexus.domain.auth.dto.UserSummaryDto> getInviteCandidates(UUID roomId);
    void inviteUsers(UUID roomId, List<UUID> userIds);
}
