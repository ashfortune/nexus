package com.team.nexus.domain.chat.repository;

import com.team.nexus.global.entity.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, UUID> {
    List<ChatParticipant> findByUserId(UUID userId);
    List<ChatParticipant> findByRoomId(UUID roomId);
    boolean existsByRoomIdAndUserId(UUID roomId, UUID userId);
    long countByRoomId(UUID roomId);
    void deleteByRoomIdAndUserId(UUID roomId, UUID userId);
    java.util.Optional<ChatParticipant> findByRoomIdAndUserId(UUID roomId, UUID userId);
}
