package com.team.nexus.domain.auth.service;

import com.team.nexus.domain.auth.dto.LoginRequestDto;
import com.team.nexus.domain.auth.dto.LoginResponseDto;
import com.team.nexus.domain.auth.dto.PasswordResetRequestDto;
import com.team.nexus.domain.auth.dto.PasswordResetResponseDto;
import com.team.nexus.domain.auth.dto.SignupRequestDto;

public interface AuthService {
    void signup(SignupRequestDto request);
    LoginResponseDto login(LoginRequestDto request);
    PasswordResetResponseDto resetPassword(PasswordResetRequestDto request);
}
