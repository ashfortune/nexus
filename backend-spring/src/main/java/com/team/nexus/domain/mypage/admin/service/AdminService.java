package com.team.nexus.domain.mypage.admin.service;

import java.util.UUID;
import com.team.nexus.domain.mypage.admin.dto.AdminDashboardDto;

public interface AdminService {
    AdminDashboardDto getDashboardData();
    void deleteBoard(UUID boardId);
    void deleteComment(UUID commentId);
    void toggleUserSuspension(UUID userId);
}
