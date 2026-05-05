package com.team.nexus.domain.mypage.service;

import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.domain.board.repository.BoardRepository;
import com.team.nexus.domain.comment.repository.CommentRepository;
import com.team.nexus.domain.grouppurchase.repository.GroupOrderRepository;
import com.team.nexus.domain.mypage.dto.MyPageResponseDto;
import com.team.nexus.global.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MyPageServiceImpl implements MyPageService {

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final CommentRepository commentRepository;
    private final GroupOrderRepository groupOrderRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public MyPageResponseDto getMyPageData(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return MyPageResponseDto.builder()
                .email(user.getEmail())
                .nickname(user.getNickname())
                .userType(user.getUserType())
                .bizNo(user.getBizNo())
                .provider(user.getLoginType() == null || user.getLoginType() == 0 ? "local"
                        : user.getLoginType() == 1 ? "google" : "kakao")
                .profileImage(user.getProfileImage())
                .posts(boardRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                        .map(b -> MyPageResponseDto.MyPostDto.builder()
                                .id(b.getId().toString())
                                .title(b.getTitle())
                                .createdAt(b.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .comments(commentRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                        .map(c -> MyPageResponseDto.MyCommentDto.builder()
                                .id(c.getId().toString())
                                .content(c.getContent())
                                .boardTitle(c.getBoard().getTitle())
                                .createdAt(c.getCreatedAt())
                                .build())
                        .collect(Collectors.toList()))
                .purchases(groupOrderRepository.findAllByUserId(userId).stream()
                        .map(o -> MyPageResponseDto.MyPurchaseDto.builder()
                                .id(o.getId().toString())
                                .title(o.getGroupPurchase().getTitle())
                                .status(o.getGroupPurchase().getStatus())
                                .createdAt(o.getPaidAt())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    @Override
    @Transactional
    public void upgradeToBusiness(UUID userId, String bizNo) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        user.setUserType(1);
        user.setBizNo(bizNo);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void unregister(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(currentPassword, user.getPasswd())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        user.setPasswd(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void updateProfileImage(UUID userId, String imageUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        user.setProfileImage(imageUrl);
        userRepository.save(user);
        log.info("User {} profile image updated to: {}", userId, imageUrl);
    }
}
