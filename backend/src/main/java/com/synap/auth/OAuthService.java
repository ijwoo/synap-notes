package com.synap.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synap.auth.dto.AuthDtos.AuthResponse;
import com.synap.auth.dto.AuthDtos.UserDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/** 소셜 ID/액세스 토큰을 검증해 우리 JWT를 발급. 세션/리다이렉트 없는 stateless 흐름. */
@Service
public class OAuthService {

    private final UserRepository users;
    private final JwtService jwt;
    private final String googleClientId;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ObjectMapper mapper = new ObjectMapper();

    public OAuthService(UserRepository users, JwtService jwt,
                        @Value("${app.oauth.google.client-id:}") String googleClientId) {
        this.users = users;
        this.jwt = jwt;
        this.googleClientId = googleClientId;
    }

    /** 구글 ID 토큰 → tokeninfo 검증(aud/email_verified). */
    public AuthResponse google(String idToken) {
        if (googleClientId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "구글 로그인이 설정되지 않았어요.");
        }
        JsonNode c = get("https://oauth2.googleapis.com/tokeninfo?id_token="
                + URLEncoder.encode(idToken, StandardCharsets.UTF_8), null);
        if (!googleClientId.equals(c.path("aud").asText())) {
            throw unauthorized("구글 토큰 audience가 일치하지 않아요.");
        }
        if (!"true".equals(c.path("email_verified").asText())) {
            throw unauthorized("이메일이 확인되지 않은 구글 계정이에요.");
        }
        String email = c.path("email").asText(null);
        String name = c.path("name").asText(email);
        return issue(email, name, "google", c.path("sub").asText());
    }

    /** 카카오 액세스 토큰 → /v2/user/me. */
    public AuthResponse kakao(String accessToken) {
        JsonNode c = get("https://kapi.kakao.com/v2/user/me", accessToken);
        String id = c.path("id").asText(null);
        if (id == null) {
            throw unauthorized("카카오 인증에 실패했어요.");
        }
        JsonNode acct = c.path("kakao_account");
        String email = acct.path("email").asText(null);
        String nickname = acct.path("profile").path("nickname").asText("카카오 사용자");
        if (email == null || email.isBlank()) {
            email = "kakao_" + id + "@kakao.local"; // 이메일 동의 안 한 경우 합성 키
        }
        return issue(email, nickname, "kakao", id);
    }

    private AuthResponse issue(String email, String name, String provider, String providerId) {
        if (email == null || email.isBlank()) {
            throw unauthorized("이메일 정보를 가져오지 못했어요.");
        }
        String key = email.trim().toLowerCase();
        User user = users.findByEmail(key)
                .orElseGet(() -> users.save(User.oauth(key, name, provider, providerId)));
        return new AuthResponse(jwt.issue(user), UserDto.from(user));
    }

    private JsonNode get(String url, String bearer) {
        try {
            HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(6)).GET();
            if (bearer != null) {
                b.header("Authorization", "Bearer " + bearer);
            }
            HttpResponse<String> res = http.send(b.build(), HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                throw unauthorized("소셜 인증에 실패했어요.");
            }
            return mapper.readTree(res.body());
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "소셜 인증 서버 통신 실패");
        }
    }

    private static ResponseStatusException unauthorized(String msg) {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, msg);
    }
}
