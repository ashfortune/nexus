package com.team.nexus.domain.mypage.controller;

import com.team.nexus.domain.mypage.dto.ChangePasswordRequestDto;
import com.team.nexus.domain.mypage.dto.MyPageResponseDto;
import com.team.nexus.domain.mypage.service.MyPageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Tag(name = "MyPage API", description = "마이페이지 관련 API (활동 내역 조회, 계정 관리 등)")
@RestController
@RequestMapping("/api/v1/mypage")
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService myPageService;

    @Operation(summary = "마이페이지 데이터 조회", description = "사용자의 활동 내역(게시글, 댓글, 공동구매)을 종합하여 조회합니다.")
    @GetMapping("/me/{userId}")
    public ResponseEntity<Map<String, Object>> getMyPageData(@PathVariable UUID userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            MyPageResponseDto data = myPageService.getMyPageData(userId);
            response.put("status", "success");
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "사업가 회원 전환", description = "일반 회원을 사업가 회원으로 전환하고 사업자 번호를 등록합니다.")
    @PatchMapping("/upgrade/{userId}")
    public ResponseEntity<Map<String, Object>> upgradeToBusiness(@PathVariable UUID userId, @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            myPageService.upgradeToBusiness(userId, request.get("bizNo"));
            response.put("status", "success");
            response.put("message", "사업가 회원으로 성공적으로 전환되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "비밀번호 변경", description = "사용자의 현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.")
    @PatchMapping("/change-password/{userId}")
    public ResponseEntity<Map<String, Object>> changePassword(@PathVariable UUID userId, @Valid @RequestBody ChangePasswordRequestDto request) {
        Map<String, Object> response = new HashMap<>();
        try {
            myPageService.changePassword(userId, request.getCurrentPassword(), request.getNewPassword());
            response.put("status", "success");
            response.put("message", "비밀번호가 성공적으로 변경되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "회원 탈퇴", description = "회원 탈퇴 처리를 수행합니다. (Soft Delete)")
    @DeleteMapping("/unregister/{userId}")
    public ResponseEntity<Map<String, Object>> unregister(@PathVariable UUID userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            myPageService.unregister(userId);
            response.put("status", "success");
            response.put("message", "회원 탈퇴 처리가 완료되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @Operation(summary = "프로필 이미지 업로드", description = "사용자의 프로필 이미지를 업로드하고 경로를 저장합니다.")
    @PostMapping("/profile-image/{userId}")
    public ResponseEntity<Map<String, Object>> uploadProfileImage(
            @PathVariable UUID userId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        try {
            myPageService.uploadProfileImage(userId, file);
            response.put("status", "success");
            response.put("message", "프로필 이미지가 성공적으로 업로드되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
