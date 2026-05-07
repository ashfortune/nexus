package com.team.nexus.domain.mypage.admin.service;

import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.domain.chat.repository.ChatRoomRepository;
import com.team.nexus.domain.grouppurchase.repository.GroupPurchaseRepository;
import com.team.nexus.domain.mypage.admin.dto.AdminDashboardDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Sort;
import com.team.nexus.global.entity.Board;
import com.team.nexus.global.entity.Comment;
import com.team.nexus.global.entity.User;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

        private final UserRepository userRepository;
        private final GroupPurchaseRepository groupPurchaseRepository;
        private final ChatRoomRepository chatRoomRepository;
        private final com.team.nexus.domain.board.repository.BoardRepository boardRepository;
        private final com.team.nexus.domain.comment.repository.CommentRepository commentRepository;
        private final jakarta.persistence.EntityManager entityManager;

        @Override
        @Transactional(readOnly = true)
        public AdminDashboardDto getDashboardData() {
                Sort sortByCreatedAt = Sort.by(Sort.Direction.DESC, "createdAt");
                
                return AdminDashboardDto.builder()
                                .users(userRepository.findAll(sortByCreatedAt).stream()
                                                .map(u -> AdminDashboardDto.UserSummaryDto.builder()
                                                                .id(u.getId().toString())
                                                                .email(u.getEmail())
                                                                .nickname(u.getNickname())
                                                                .userType(u.getUserType())
                                                                .loginType(u.getLoginType())
                                                                .bizNo(u.getBizNo())
                                                                .createdAt(u.getCreatedAt())
                                                                .isSuspended(u.getIsSuspended() != null
                                                                                && u.getIsSuspended())
                                                                .build())
                                                .collect(Collectors.toList()))
                                .boards(boardRepository.findAll(sortByCreatedAt).stream()
                                                .map(b -> {
                                                        String type = "일반";
                                                        if (b.getRegionName() != null && !b.getRegionName().isEmpty()) {
                                                                type = "지역 (" + b.getRegionName() + ")";
                                                        } else if (b.getIndustryCategory() != null) {
                                                                type = "업종 (" + b.getIndustryCategory().getName() + ")";
                                                        } else if (b.getCategoryName() != null) {
                                                                type = b.getCategoryName();
                                                        }

                                                        return AdminDashboardDto.BoardSummaryDto.builder()
                                                                        .id(b.getId().toString())
                                                                        .title(b.getTitle())
                                                                        .authorNickname(b.getUser() != null ? b.getUser().getNickname() : "알 수 없음")
                                                                        .boardType(type)
                                                                        .createdAt(b.getCreatedAt())
                                                                        .build();
                                                })
                                                .collect(Collectors.toList()))
                                .comments(commentRepository.findAll(sortByCreatedAt).stream()
                                                .map(c -> {
                                                        String type = "일반";
                                                        Board b = c.getBoard();
                                                        if (b != null) {
                                                                if (b.getRegionName() != null && !b.getRegionName().isEmpty()) {
                                                                        type = "지역 (" + b.getRegionName() + ")";
                                                                } else if (b.getIndustryCategory() != null) {
                                                                        type = "업종 (" + b.getIndustryCategory().getName() + ")";
                                                                } else if (b.getCategoryName() != null) {
                                                                        type = b.getCategoryName();
                                                                }
                                                        }

                                                        return AdminDashboardDto.CommentSummaryDto.builder()
                                                                        .id(c.getId().toString())
                                                                        .content(c.getContent())
                                                                        .authorNickname(c.getUser() != null ? c.getUser().getNickname() : "알 수 없음")
                                                                        .boardTitle(b != null ? b.getTitle() : "삭제된 게시글")
                                                                        .boardId(b != null ? b.getId().toString() : null)
                                                                        .boardType(type)
                                                                        .createdAt(c.getCreatedAt())
                                                                        .build();
                                                })
                                                .collect(Collectors.toList()))
                                .purchases(groupPurchaseRepository.findAll(Sort.by(Sort.Direction.DESC, "startDate")).stream()
                                                .map(p -> AdminDashboardDto.PurchaseSummaryDto.builder()
                                                                .id(p.getId().toString())
                                                                .title(p.getTitle())
                                                                .status(p.getStatus())
                                                                .currentCount(p.getCurrentCount())
                                                                .createdAt(p.getStartDate())
                                                                .build())
                                                .collect(Collectors.toList()))
                                .chatRooms(chatRoomRepository.findAll(sortByCreatedAt).stream()
                                                .map(cr -> AdminDashboardDto.ChatRoomSummaryDto.builder()
                                                                .id(cr.getId().toString())
                                                                .title(cr.getTitle())
                                                                .creatorNickname(cr.getCreator() != null
                                                                                ? cr.getCreator().getNickname()
                                                                                : "탈퇴한 사용자")
                                                                .createdAt(cr.getCreatedAt())
                                                                .build())
                                                .collect(Collectors.toList()))
                                .build();
        }

        @Override
        @Transactional
        public void deleteBoard(UUID boardId) {
                log.info("Attempting dynamic cleanup and deletion for board: {}", boardId);

                try {
                        // 1. boards 테이블을 참조하는 모든 하위 테이블과 컬럼명을 실시간 조회
                        String findReferencingTablesSql = "SELECT tc.table_name, kcu.column_name " +
                                        "FROM information_schema.table_constraints AS tc " +
                                        "JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema "
                                        +
                                        "JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema "
                                        +
                                        "WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'boards'";

                        @SuppressWarnings("unchecked")
                        List<Object[]> results = entityManager.createNativeQuery(findReferencingTablesSql)
                                        .getResultList();

                        // 2. 발견된 모든 하위 테이블에서 해당 게시글 관련 데이터 선제적 삭제
                        // (댓글의 경우 대댓글 제약조건 때문에 더 신중하게 처리해야 함)
                        for (Object[] row : results) {
                                String tableName = (String) row[0];
                                String columnName = (String) row[1];

                                log.info("Cleaning up referencing table: {} (column: {})", tableName, columnName);
                                
                                // 댓글 테이블인 경우 대댓글(self-reference) 관계를 먼저 끊어줘야 함
                                if ("comments".equals(tableName)) {
                                        log.info("Special cleanup for comments: clearing parent_comment_id first");
                                        String clearParentSql = "UPDATE comments SET parent_comment_id = NULL WHERE board_id = :boardId";
                                        entityManager.createNativeQuery(clearParentSql)
                                                        .setParameter("boardId", boardId)
                                                        .executeUpdate();
                                }

                                String deleteSql = String.format("DELETE FROM %s WHERE %s = :boardId", tableName,
                                                columnName);
                                entityManager.createNativeQuery(deleteSql)
                                                .setParameter("boardId", boardId)
                                                .executeUpdate();
                        }

                        // 3. 모든 방해 요소 제거 후 메인 게시글 삭제
                        boardRepository.deleteById(boardId);
                        log.info("Successfully deleted board: {}", boardId);

                } catch (Exception e) {
                        log.error("Dynamic deletion failed for board {}: {}", boardId, e.getMessage());
                        throw new RuntimeException("게시글 삭제 중 제약 조건 해결에 실패했습니다: " + e.getMessage());
                }
        }

        @Override
        @Transactional
        public void deleteComment(UUID commentId) {
                commentRepository.deleteById(commentId);
        }

        @Override
        @Transactional
        public void toggleUserSuspension(UUID userId) {
                userRepository.findById(userId).ifPresent(user -> {
                        boolean current = user.getIsSuspended() != null && user.getIsSuspended();
                        user.setIsSuspended(!current);
                        userRepository.save(user);
                });
        }
}
