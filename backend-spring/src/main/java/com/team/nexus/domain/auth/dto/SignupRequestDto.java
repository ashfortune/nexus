package com.team.nexus.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "회원가입 요청 데이터")
public class SignupRequestDto {

    @Schema(description = "사용자 이메일 (로그인 ID)", example = "user@example.com")
    @NotBlank(message = "이메일은 필수 입력 항목입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private String email;

    @Schema(description = "비밀번호 (8자 이상, 특수문자 포함)", example = "password123!")
    @NotBlank(message = "비밀번호는 필수 입력 항목입니다.")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다.")
    @Pattern(regexp = ".*[!@#$%^&*()].*", message = "비밀번호는 최소 하나의 특수문자를 포함해야 합니다.")
    private String password;

    @Schema(description = "닉네임", example = "홍길동")
    @NotBlank(message = "닉네임은 필수 입력 항목입니다.")
    private String nickname;

    @Schema(description = "주소", example = "서울특별시 강남구 ...")
    @NotBlank(message = "주소는 필수 입력 항목입니다.")
    private String address;

    @Schema(description = "사용자 유형 (0: 일반, 1: 사업가, 2: 관리자)", example = "0")
    private Integer userType;

    @Schema(description = "사업자 등록 번호 (사업가 회원 필수)", example = "123-45-67890")
    private String bizNo;
}
