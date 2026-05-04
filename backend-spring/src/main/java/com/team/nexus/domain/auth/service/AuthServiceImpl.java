package com.team.nexus.domain.auth.service;

import com.team.nexus.domain.auth.dto.PasswordResetRequestDto;
import com.team.nexus.domain.auth.dto.PasswordResetResponseDto;
import com.team.nexus.domain.auth.dto.LoginRequestDto;
import com.team.nexus.domain.auth.dto.LoginResponseDto;
import com.team.nexus.domain.auth.dto.SignupRequestDto;
import com.team.nexus.domain.auth.repository.UserRepository;
import com.team.nexus.global.entity.User;
import com.team.nexus.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public void signup(SignupRequestDto request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            log.error("이미 존재하는 이메일입니다: {}", request.getEmail());
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwd(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .address(request.getAddress())
                .userType(request.getUserType())
                .bizNo(request.getUserType() == 1 ? request.getBizNo() : null)
                .loginType(0)
                .build();

        userRepository.save(user);
        log.info("회원가입 성공: {}", request.getEmail());
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponseDto login(LoginRequestDto request) {
        // 1. 사용자 조회
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // 2. 비밀번호 검증
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswd())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        // 3. 토큰 생성
        String token = jwtTokenProvider.createToken(user.getEmail(), user.getId(), user.getUserType());

        return new LoginResponseDto(
                user.getId().toString(),
                token,
                user.getNickname(),
                user.getUserType()
        );
    }

    @Override
    @Transactional
    public PasswordResetResponseDto resetPassword(PasswordResetRequestDto request) {
        // 1. 사용자 조회
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        // 2. 임시 비밀번호 생성 (8자리 이상, 특수문자 포함)
        String temporaryPassword = generateTemporaryPassword();

        // 3. 비밀번호 업데이트
        user.setPasswd(passwordEncoder.encode(temporaryPassword));
        userRepository.save(user);

        log.info("비밀번호 재설정 완료: {}", request.getEmail());

        return PasswordResetResponseDto.builder()
                .temporaryPassword(temporaryPassword)
                .build();
    }

    private String generateTemporaryPassword() {
        String upperCaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lowerCaseLetters = "abcdefghijklmnopqrstuvwxyz";
        String numbers = "0123456789";
        String specialCharacters = "!@#$%^&*()";
        String combinedChars = upperCaseLetters + lowerCaseLetters + numbers + specialCharacters;

        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();

        // 최소 요구 사항 충족을 위해 각각 하나씩 추가
        password.append(lowerCaseLetters.charAt(random.nextInt(lowerCaseLetters.length())));
        password.append(numbers.charAt(random.nextInt(numbers.length())));
        password.append(specialCharacters.charAt(random.nextInt(specialCharacters.length())));

        // 나머지 7자리를 무작위로 추가 (총 10자리)
        for (int i = 0; i < 7; i++) {
            password.append(combinedChars.charAt(random.nextInt(combinedChars.length())));
        }

        // 비밀번호 순서 섞기
        char[] passwordArray = password.toString().toCharArray();
        for (int i = passwordArray.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = passwordArray[i];
            passwordArray[i] = passwordArray[j];
            passwordArray[j] = temp;
        }

        return new String(passwordArray);
    }
}
