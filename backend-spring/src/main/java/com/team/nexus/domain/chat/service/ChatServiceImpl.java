package com.team.nexus.domain.chat.service;

import com.team.nexus.domain.chat.dto.ChatMessageRequestDto;
import com.team.nexus.domain.chat.dto.ChatMessageResponseDto;
import com.team.nexus.domain.chat.dto.ChatRoomResponseDto;
import com.team.nexus.domain.chat.repository.ChatMessageRepository;
import com.team.nexus.domain.chat.repository.ChatParticipantRepository;
import com.team.nexus.domain.chat.repository.ChatRoomRepository;
import com.team.nexus.global.entity.ChatMessage;
import com.team.nexus.global.entity.ChatRoom;
import com.team.nexus.global.entity.ChatParticipant;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final com.team.nexus.domain.auth.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public ChatRoomResponseDto createRoom(String title, ChatRoom.ChatRoomType type, String description, String imageUrl, UUID creatorId, String password) {
        log.info("Creating chat room: title={}, type={}, creatorId={}", title, type, creatorId);
        try {
            User creator = userRepository.findById(creatorId)
                    .orElseThrow(() -> new IllegalArgumentException("방 생성자를 찾을 수 없습니다."));

            ChatRoom chatRoom = ChatRoom.builder()
                    .title(title)
                    .type(type)
                    .description(description)
                    .imageUrl(imageUrl)
                    .creator(creator)
                    .password(password != null && !password.isEmpty() ? passwordEncoder.encode(password) : null)
                    .build();
            ChatRoom savedRoom = chatRoomRepository.save(chatRoom);
            log.info("Chat room saved successfully: id={}", savedRoom.getId());

            try {
                joinRoom(savedRoom.getId(), creatorId, password);
                log.info("Creator joined the room as participant: userId={}", creatorId);
            } catch (Exception memberEx) {
                log.warn("Failed to join creator to room automatically: {}", memberEx.getMessage());
            }
            
            return convertToResponseDto(savedRoom);
        } catch (Exception e) {
            log.error("Failed to create chat room: ", e);
            throw e;
        }
    }

    @Override
    @Transactional
    public void joinRoom(UUID roomId, UUID userId, String password) {
        if (!chatParticipantRepository.existsByRoomIdAndUserId(roomId, userId)) {
            ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                    .orElseThrow(() -> new IllegalArgumentException("방을 찾을 수 없습니다."));
            
            // 비밀번호 확인 로직 추가 (BCrypt 적용)
            if (chatRoom.getPassword() != null && !chatRoom.getPassword().isEmpty()) {
                if (password == null || !passwordEncoder.matches(password, chatRoom.getPassword())) {
                    throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
                }
            }

            if (chatRoom.getType() == ChatRoom.ChatRoomType.PRIVATE) {
                long count = chatParticipantRepository.countByRoomId(roomId);
                if (count >= 2) {
                    throw new IllegalStateException("1:1 채팅방은 정원이 가득 찼습니다.");
                }
            }

            ChatParticipant participant = ChatParticipant.builder()
                    .roomId(roomId)
                    .userId(userId)
                    .joinedAt(LocalDateTime.now())
                    .build();
            chatParticipantRepository.save(participant);

            // 시스템 메시지 발송 (입장)
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                sendSystemMessage(roomId, userId, user.getNickname(), user.getNickname() + "님이 입장하셨습니다.", ChatMessage.MessageType.ENTER);
            }
        }
    }

    @Override
    @Transactional
    public ChatMessageResponseDto saveMessage(ChatMessageRequestDto messageDto) {
        log.info("Saving message: senderId={}, roomId={}, type={}", messageDto.getSenderId(), messageDto.getRoomId(), messageDto.getType());
        try {
            log.info("Processing message save: senderId={}, roomId={}, type={}, fileUrl={}", 
                    messageDto.getSenderId(), messageDto.getRoomId(), messageDto.getType(), messageDto.getFileUrl());
            
            User user = userRepository.findById(messageDto.getSenderId())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. ID: " + messageDto.getSenderId()));

            // content가 null이면 제약 조건 위반이 발생하므로 기본값 설정
            String content = messageDto.getMessage();
            if (content == null || content.trim().isEmpty()) {
                if (messageDto.getType() == ChatMessage.MessageType.IMAGE) content = "사진을 보냈습니다.";
                else if (messageDto.getType() == ChatMessage.MessageType.FILE) content = "파일을 보냈습니다.";
                else content = "(내용 없음)";
            }

            ChatMessage chatMessage = ChatMessage.builder()
                    .roomId(messageDto.getRoomId())
                    .userId(messageDto.getSenderId())
                    .senderNickname(user.getNickname())
                    .content(content)
                    .type(messageDto.getType())
                    .fileUrl(messageDto.getFileUrl())
                    .fileName(messageDto.getFileName())
                    .build();
            
            ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
            log.info("Successfully saved message to DB. ID: {}", savedMessage.getId());

            // 채팅방의 마지막 메시지 시각 업데이트
            ChatRoom room = chatRoomRepository.findById(messageDto.getRoomId())
                    .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
            room.setLastMessageAt(LocalDateTime.now());
            chatRoomRepository.save(room);

            return ChatMessageResponseDto.builder()
                    .roomId(savedMessage.getRoomId())
                    .senderId(savedMessage.getUserId())
                    .senderNickname(savedMessage.getSenderNickname())
                    .senderProfileImageUrl("")
                    .message(savedMessage.getContent())
                    .type(savedMessage.getType())
                    .fileUrl(savedMessage.getFileUrl())
                    .fileName(savedMessage.getFileName())
                    .createdAt(LocalDateTime.now())
                    .build();
        } catch (Exception e) {
            log.error("Failed to save chat message. RequestDto: {}", messageDto);
            log.error("Error details: ", e);
            throw new RuntimeException("메시지 저장 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @Override
    public List<ChatMessageResponseDto> getMessages(UUID roomId, UUID userId) {
        log.info("Fetching messages for room: roomId={}, userId={}", roomId, userId);
        try {
            // 해당 유저의 방 참여 시점 조회 (그 이후 메시지만 보이도록)
            LocalDateTime joinedAt = chatParticipantRepository.findByRoomIdAndUserId(roomId, userId)
                    .map(ChatParticipant::getJoinedAt)
                    .orElse(LocalDateTime.MIN);
            
            return chatMessageRepository.findByRoomIdAndCreatedAtAfterOrderByCreatedAtAsc(roomId, joinedAt)
                    .stream()
                    .map(msg -> ChatMessageResponseDto.builder()
                            .roomId(roomId)
                            .senderId(msg.getUserId())
                            .senderNickname(msg.getSenderNickname() != null ? msg.getSenderNickname() : "익명")
                            .senderProfileImageUrl("") 
                            .message(msg.getContent())
                            .type(msg.getType())
                            .fileUrl(msg.getFileUrl())
                            .fileName(msg.getFileName())
                            .createdAt(msg.getCreatedAt() != null ? msg.getCreatedAt() : LocalDateTime.now())
                            .build())
                    .toList();
        } catch (Exception e) {
            log.error("Failed to fetch messages for room: " + roomId, e);
            return List.of();
        }
    }

    @Override
    public List<ChatRoomResponseDto> getAllRooms() {
        return chatRoomRepository.findAll().stream()
                .filter(room -> {
                    if (room.getType() == ChatRoom.ChatRoomType.PRIVATE) {
                        return chatParticipantRepository.countByRoomId(room.getId()) < 2;
                    }
                    return true;
                })
                .sorted((r1, r2) -> {
                    LocalDateTime t1 = r1.getLastMessageAt() != null ? r1.getLastMessageAt() : r1.getCreatedAt();
                    LocalDateTime t2 = r2.getLastMessageAt() != null ? r2.getLastMessageAt() : r2.getCreatedAt();
                    return t2.compareTo(t1);
                })
                .map(this::convertToResponseDto)
                .toList();
    }

    @Override
    @Transactional
    public void leaveRoom(UUID roomId, UUID userId) {
        log.info("Leaving chat room: roomId={}, userId={}", roomId, userId);
        
        // 시스템 메시지 발송 (퇴장)
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            sendSystemMessage(roomId, userId, user.getNickname(), user.getNickname() + "님이 퇴장하셨습니다.", ChatMessage.MessageType.LEAVE);
        }

        chatParticipantRepository.deleteByRoomIdAndUserId(roomId, userId);
        
        // 참가자가 0명이면 방 삭제
        long participantCount = chatParticipantRepository.countByRoomId(roomId);
        if (participantCount == 0) {
            log.info("Room is empty. Deleting room: id={}", roomId);
            chatRoomRepository.deleteById(roomId);
        }
    }

    @Override
    public List<ChatRoomResponseDto> getJoinedRooms(UUID userId) {
        List<UUID> roomIds = chatParticipantRepository.findByUserId(userId)
                .stream()
                .map(ChatParticipant::getRoomId)
                .toList();
        return chatRoomRepository.findAllById(roomIds).stream()
                .sorted((r1, r2) -> {
                    LocalDateTime t1 = r1.getLastMessageAt() != null ? r1.getLastMessageAt() : r1.getCreatedAt();
                    LocalDateTime t2 = r2.getLastMessageAt() != null ? r2.getLastMessageAt() : r2.getCreatedAt();
                    return t2.compareTo(t1);
                })
                .map(this::convertToResponseDto)
                .toList();
    }

    @Override
    public List<com.team.nexus.domain.auth.dto.UserSummaryDto> getInviteCandidates(UUID roomId) {
        // 현재 방에 참여 중인 유저 ID 목록 조회
        List<UUID> participantIds = chatParticipantRepository.findByRoomId(roomId)
                .stream()
                .map(ChatParticipant::getUserId)
                .toList();
        
        // 참여 중이지 않은 유저들 조회
        if (participantIds.isEmpty()) {
            return userRepository.findAll().stream()
                    .map(user -> com.team.nexus.domain.auth.dto.UserSummaryDto.builder()
                            .id(user.getId())
                            .nickname(user.getNickname())
                            .email(user.getEmail())
                            .build())
                    .toList();
        }

        return userRepository.findAll().stream()
                .filter(user -> !participantIds.contains(user.getId()))
                .map(user -> com.team.nexus.domain.auth.dto.UserSummaryDto.builder()
                        .id(user.getId())
                        .nickname(user.getNickname())
                        .email(user.getEmail())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public void inviteUsers(UUID roomId, List<UUID> userIds) {
        log.info("Inviting users to room: roomId={}, userCount={}", roomId, userIds.size());
        
        for (UUID userId : userIds) {
            if (!chatParticipantRepository.existsByRoomIdAndUserId(roomId, userId)) {
                ChatParticipant participant = ChatParticipant.builder()
                        .roomId(roomId)
                        .userId(userId)
                        .joinedAt(LocalDateTime.now())
                        .build();
                chatParticipantRepository.save(participant);

                // 시스템 메시지 발송 (초대)
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    sendSystemMessage(roomId, userId, user.getNickname(), user.getNickname() + "님이 초대되었습니다.", ChatMessage.MessageType.ENTER);
                }
            }
        }
    }

    private void sendSystemMessage(UUID roomId, UUID userId, String nickname, String content, ChatMessage.MessageType type) {
        ChatMessage chatMessage = ChatMessage.builder()
                .roomId(roomId)
                .userId(userId)
                .senderNickname(nickname)
                .content(content)
                .type(type)
                .build();
        
        chatMessageRepository.save(chatMessage);
        
        ChatMessageResponseDto responseDto = ChatMessageResponseDto.builder()
                .roomId(roomId)
                .senderId(userId)
                .senderNickname("시스템")
                .message(content)
                .type(type)
                .createdAt(LocalDateTime.now())
                .build();
        
        messagingTemplate.convertAndSend("/topic/chat/" + roomId, responseDto);
    }

    private ChatRoomResponseDto convertToResponseDto(ChatRoom chatRoom) {
        String lastMessage = chatMessageRepository.findFirstByRoomIdOrderByCreatedAtDesc(chatRoom.getId())
                .map(msg -> msg.getType() == ChatMessage.MessageType.IMAGE ? "(사진)" : 
                            msg.getType() == ChatMessage.MessageType.FILE ? "(파일)" : msg.getContent())
                .orElse(null);

        Long participantCount = chatParticipantRepository.countByRoomId(chatRoom.getId());

        return ChatRoomResponseDto.builder()
                .id(chatRoom.getId())
                .title(chatRoom.getTitle())
                .description(chatRoom.getDescription())
                .imageUrl(chatRoom.getImageUrl())
                .type(chatRoom.getType())
                .creatorId(chatRoom.getCreator() != null ? chatRoom.getCreator().getId() : null)
                .creatorNickname(chatRoom.getCreator() != null ? chatRoom.getCreator().getNickname() : "익명")
                .lastMessage(lastMessage)
                .lastMessageAt(chatRoom.getLastMessageAt() != null ? chatRoom.getLastMessageAt() : chatRoom.getCreatedAt())
                .createdAt(chatRoom.getCreatedAt())
                .participantCount(participantCount)
                .hasPassword(chatRoom.getPassword() != null && !chatRoom.getPassword().isEmpty())
                .build();
    }
}
