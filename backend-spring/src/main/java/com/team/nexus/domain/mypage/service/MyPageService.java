package com.team.nexus.domain.mypage.service;

import com.team.nexus.domain.mypage.dto.MyPageResponseDto;
import java.util.UUID;

public interface MyPageService {
    MyPageResponseDto getMyPageData(UUID userId);
    void upgradeToBusiness(UUID userId, String bizNo);
    void unregister(UUID userId);
    void changePassword(UUID userId, String currentPassword, String newPassword);
    void uploadProfileImage(UUID userId, org.springframework.web.multipart.MultipartFile file);
}
