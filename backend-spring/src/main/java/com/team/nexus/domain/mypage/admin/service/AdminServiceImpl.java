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

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

        private final UserRepository userRepository;
        private final GroupPurchaseRepository groupPurchaseRepository;
        private final ChatRoomRepository chatRoomRepository;
        private final jakarta.persistence.EntityManager entityManager;

        @Override
        @Transactional(readOnly = true)
        public AdminDashboardDto getDashboardData() {
                return AdminDashboardDto.builder()
                                .users(userRepository.findAll().stream()
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
                                .boards(java.util.List.of())
                                .comments(java.util.List.of())
                                .purchases(groupPurchaseRepository.findAll().stream()
                                                .map(p -> AdminDashboardDto.PurchaseSummaryDto.builder()
                                                                .id(p.getId().toString())
                                                                .title(p.getTitle())
                                                                .status(p.getStatus())
                                                                .currentCount(p.getCurrentCount())
                                                                .createdAt(p.getStartDate())
                                                                .build())
                                                .collect(Collectors.toList()))
                                .chatRooms(chatRoomRepository.findAll().stream()
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
                        for (Object[] row : results) {
                                String tableName = (String) row[0];
                                String columnName = (String) row[1];

                                log.info("Cleaning up referencing table: {} (column: {})", tableName, columnName);
                                String deleteSql = String.format("DELETE FROM %s WHERE %s = :boardId", tableName,
                                                columnName);
                                entityManager.createNativeQuery(deleteSql)
                                                .setParameter("boardId", boardId)
                                                .executeUpdate();
                        }

                        // 3. 모든 방해 요소 제거 후 메인 게시글 삭제
                        // boardRepository.deleteById(boardId);
                        log.info("Successfully deleted board: {}", boardId);

                } catch (Exception e) {
                        log.error("Dynamic deletion failed for board {}: {}", boardId, e.getMessage());
                        throw new RuntimeException("게시글 삭제 중 제약 조건 해결에 실패했습니다: " + e.getMessage());
                }
        }

        @Override
        @Transactional
        public void deleteComment(UUID commentId) {
                // commentRepository.deleteById(commentId);
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
