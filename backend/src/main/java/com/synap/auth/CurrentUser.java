package com.synap.auth;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

/** SecurityContext 에 담긴 현재 사용자 id 헬퍼 (JwtAuthFilter 가 principal=userId 로 세팅). */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static Long id() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a != null && a.getPrincipal() instanceof Long id) {
            return id;
        }
        throw new ResponseStatusException(UNAUTHORIZED, "Not authenticated");
    }
}
