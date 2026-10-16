package com.synap.auth.dto;

import com.synap.auth.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    public record RegisterRequest(
            @Email(message = "올바른 이메일 형식이 아니에요") @NotBlank(message = "이메일을 입력하세요") String email,
            @NotBlank(message = "비밀번호를 입력하세요") @Size(min = 6, message = "비밀번호는 6자 이상이어야 해요") String password,
            @NotBlank(message = "이름을 입력하세요") String displayName
    ) {
    }

    public record LoginRequest(
            @Email(message = "올바른 이메일 형식이 아니에요") @NotBlank(message = "이메일을 입력하세요") String email,
            @NotBlank(message = "비밀번호를 입력하세요") String password
    ) {
    }

    public record UserDto(Long id, String email, String displayName) {
        public static UserDto from(User u) {
            return new UserDto(u.getId(), u.getEmail(), u.getDisplayName());
        }
    }

    public record NameChangeRequest(@NotBlank(message = "이름을 입력하세요") String displayName) {
    }

    public record PasswordChangeRequest(
            String currentPassword,
            @NotBlank @Size(min = 6, message = "비밀번호는 6자 이상") String newPassword
    ) {
    }

    public record GoogleLoginRequest(@NotBlank String idToken) {
    }

    public record KakaoLoginRequest(@NotBlank String accessToken) {
    }

    public record AuthResponse(String token, UserDto user) {
    }

    private AuthDtos() {
    }
}
