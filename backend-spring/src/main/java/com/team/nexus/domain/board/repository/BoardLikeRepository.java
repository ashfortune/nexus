package com.team.nexus.domain.board.repository;

import com.team.nexus.global.entity.BoardLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardLikeRepository extends JpaRepository<BoardLike, UUID> {
    Optional<BoardLike> findByBoardIdAndUserId(UUID boardId, UUID userId);
    boolean existsByBoardIdAndUserId(UUID boardId, UUID userId);
    void deleteByBoardIdAndUserId(UUID boardId, UUID userId);
}
