package com.team.nexus.domain.auth.controller;

import com.team.nexus.domain.auth.dto.LoginRequestDto;
import com.team.nexus.domain.auth.dto.LoginResponseDto;
import com.team.nexus.domain.auth.dto.PasswordResetRequestDto;
import com.team.nexus.domain.auth.dto.PasswordResetResponseDto;
import com.team.nexus.domain.auth.dto.SignupRequestDto;
import com.team.nexus.domain.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Tag(name = "Authentication", description = "인증 및 회원가입 관련 API")
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "회원가입", description = "신규 사용자를 등록합니다. 일반 회원과 사업가 회원을 구분하여 가입할 수 있습니다.")
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@Valid @RequestBody SignupRequestDto request) {
        Map<String, Object> response = new HashMap<>();
        try {
            authService.signup(request);
            response.put("status", "success");
            response.put("message", "회원가입이 완료되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "서버 내부 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @Operation(summary = "로그인", description = "이메일과 비밀번호로 로그인하여 JWT 토큰을 발급받습니다.")
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequestDto request) {
        Map<String, Object> response = new HashMap<>();
        try {
            LoginResponseDto loginResponse = authService.login(request);
            response.put("status", "success");
            response.put("data", loginResponse);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(401).body(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "서버 내부 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @Operation(summary = "비밀번호 재설정", description = "이메일을 입력받아 임시 비밀번호를 생성하고 반환합니다.")
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody PasswordResetRequestDto request) {
        Map<String, Object> response = new HashMap<>();
        try {
            PasswordResetResponseDto resetResponse = authService.resetPassword(request);
            response.put("status", "success");
            response.put("data", resetResponse);
            response.put("message", "임시 비밀번호가 생성되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "서버 내부 오류가 발생했습니다.");
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
