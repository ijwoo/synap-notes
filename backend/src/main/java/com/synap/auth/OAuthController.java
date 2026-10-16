package com.synap.auth;

import com.synap.auth.dto.AuthDtos.AuthResponse;
import com.synap.auth.dto.AuthDtos.GoogleLoginRequest;
import com.synap.auth.dto.AuthDtos.KakaoLoginRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class OAuthController {

    private final OAuthService oauth;

    public OAuthController(OAuthService oauth) {
        this.oauth = oauth;
    }

    @PostMapping("/google")
    public AuthResponse google(@Valid @RequestBody GoogleLoginRequest req) {
        return oauth.google(req.idToken());
    }

    @PostMapping("/kakao")
    public AuthResponse kakao(@Valid @RequestBody KakaoLoginRequest req) {
        return oauth.kakao(req.accessToken());
    }
}
