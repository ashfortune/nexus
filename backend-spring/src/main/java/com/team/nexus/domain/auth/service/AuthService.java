package com.team.nexus.domain.auth.service;

import com.team.nexus.domain.auth.dto.*;

public interface AuthService {
    void signup(SignupRequestDto request);
    LoginResponseDto login(LoginRequestDto request);
    PasswordResetResponseDto resetPassword(PasswordResetRequestDto request);
}
