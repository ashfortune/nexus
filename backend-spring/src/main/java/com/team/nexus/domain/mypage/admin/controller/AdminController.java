package com.team.nexus.domain.mypage.admin.controller;

import com.team.nexus.domain.mypage.admin.dto.AdminDashboardDto;
import com.team.nexus.domain.mypage.admin.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Admin API", description = "관리자 전용 데이터 관리 API (마이페이지 통합)")
@RestController
@RequestMapping("/api/v1/mypage/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @Operation(summary = "전체 데이터 대시보드 조회", description = "시스템의 모든 회원, 게시글, 댓글, 공동구매, 채팅 목록을 한 번에 조회합니다.")
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        Map<String, Object> response = new HashMap<>();
        try {
            AdminDashboardDto data = adminService.getDashboardData();
            response.put("status", "success");
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "게시글 삭제", description = "관리자 권한으로 게시글을 삭제합니다.")
    @DeleteMapping("/boards/{id}")
    public ResponseEntity<Map<String, Object>> deleteBoard(@PathVariable UUID id) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.deleteBoard(id);
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "댓글 삭제", description = "관리자 권한으로 댓글을 삭제합니다.")
    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Map<String, Object>> deleteComment(@PathVariable UUID id) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.deleteComment(id);
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "회원 정지/해제", description = "관리자 권한으로 회원의 활동을 정지하거나 해제합니다.")
    @PatchMapping("/users/{id}/suspend")
    public ResponseEntity<Map<String, Object>> toggleUserSuspension(@PathVariable UUID id) {
        Map<String, Object> response = new HashMap<>();
        try {
            adminService.toggleUserSuspension(id);
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
