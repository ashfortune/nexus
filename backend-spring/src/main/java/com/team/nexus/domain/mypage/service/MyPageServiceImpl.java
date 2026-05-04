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

        user.setUserType(1); // 1: 사업가 회원
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
    public void uploadProfileImage(UUID userId, org.springframework.web.multipart.MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        try {
            // Spring Boot 실행 경로 기준 uploads 폴더 사용
            String uploadDir = "uploads/profiles/";
            java.io.File dir = new java.io.File(uploadDir);
            if (!dir.exists())
                dir.mkdirs();

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String savedFilename = UUID.randomUUID().toString() + extension;
            java.nio.file.Path path = java.nio.file.Paths.get(uploadDir + savedFilename).toAbsolutePath().normalize();

            java.nio.file.Files.copy(file.getInputStream(), path, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            // GroupPurchaseFileController의 display 엔드포인트를 통해 접근하도록 경로 설정
            user.setProfileImage("/api/v1/group-purchases/files/display/profiles/" + savedFilename);
            userRepository.save(user);
        } catch (java.io.IOException e) {
            throw new RuntimeException("프로필 이미지 업로드 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
