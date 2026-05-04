package com.team.nexus.domain.chat.repository;

import com.team.nexus.global.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {
}
