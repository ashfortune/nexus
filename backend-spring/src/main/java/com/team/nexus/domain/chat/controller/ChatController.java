package com.team.nexus.domain.chat.controller;

import com.team.nexus.domain.chat.dto.ChatMessageRequestDto;
import com.team.nexus.domain.chat.service.ChatService;
import com.team.nexus.global.entity.ChatMessage;
import com.team.nexus.global.entity.ChatRoom;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Chat", description = "실시간 채팅 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/chat")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // --- WebSocket Endpoints ---

    @MessageMapping("/chat/send")
    public void sendMessage(ChatMessageRequestDto messageDto) {
        // 1. 메시지 저장 및 응답 DTO 생성
        com.team.nexus.domain.chat.dto.ChatMessageResponseDto responseDto = chatService.saveMessage(messageDto);
        
        // 2. 해당 채팅방 구독자들에게 브로드캐스트
        // 클라이언트는 /topic/chat/room/{roomId} 를 구독하고 있어야 함
        messagingTemplate.convertAndSend("/topic/chat/" + messageDto.getRoomId(), responseDto);
    }

    // --- REST Endpoints ---

    @Operation(summary = "채팅방 생성")
    @PostMapping("/rooms")
    public ResponseEntity<com.team.nexus.domain.chat.dto.ChatRoomResponseDto> createRoom(@RequestBody com.team.nexus.domain.chat.dto.ChatRoomRequestDto requestDto) {
        return ResponseEntity.ok(chatService.createRoom(requestDto.getTitle(), requestDto.getType(), requestDto.getDescription(), requestDto.getImageUrl(), requestDto.getCreatorId(), requestDto.getPassword()));
    }

    @Operation(summary = "채팅방 참가")
    @PostMapping("/rooms/{roomId}/join")
    public ResponseEntity<Void> joinRoom(@PathVariable UUID roomId, @RequestParam UUID userId, @RequestParam(required = false) String password) {
        chatService.joinRoom(roomId, userId, password);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "채팅방 나가기")
    @PostMapping("/rooms/{roomId}/leave")
    public ResponseEntity<Void> leaveRoom(@PathVariable UUID roomId, @RequestParam UUID userId) {
        chatService.leaveRoom(roomId, userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "내 채팅방 목록 조회")
    @GetMapping("/rooms/mine")
    public ResponseEntity<List<com.team.nexus.domain.chat.dto.ChatRoomResponseDto>> getMyRooms(@RequestParam UUID userId) {
        return ResponseEntity.ok(chatService.getJoinedRooms(userId));
    }

    @Operation(summary = "모든 채팅방 조회")
    @GetMapping("/rooms")
    public ResponseEntity<List<com.team.nexus.domain.chat.dto.ChatRoomResponseDto>> getAllRooms() {
        return ResponseEntity.ok(chatService.getAllRooms());
    }

    @Operation(summary = "채팅방 메시지 내역 조회")
    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<com.team.nexus.domain.chat.dto.ChatMessageResponseDto>> getMessages(
            @PathVariable UUID roomId,
            @RequestParam UUID userId) {
        return ResponseEntity.ok(chatService.getMessages(roomId, userId));
    }

    @Operation(summary = "초대 가능한 사용자 목록 조회")
    @GetMapping("/rooms/{roomId}/invite-candidates")
    public ResponseEntity<List<com.team.nexus.domain.auth.dto.UserSummaryDto>> getInviteCandidates(@PathVariable UUID roomId) {
        return ResponseEntity.ok(chatService.getInviteCandidates(roomId));
    }

    @Operation(summary = "사용자 초대")
    @PostMapping("/rooms/{roomId}/invite")
    public ResponseEntity<Void> inviteUsers(@PathVariable UUID roomId, @RequestBody List<UUID> userIds) {
        chatService.inviteUsers(roomId, userIds);
        return ResponseEntity.ok().build();
    }
}
