package com.synap.auth;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JdbcTemplate jdbc;

    public AccountService(UserRepository users, PasswordEncoder encoder, JdbcTemplate jdbc) {
        this.users = users;
        this.encoder = encoder;
        this.jdbc = jdbc;
    }

    /** 표시 이름 변경. */
    @Transactional
    public com.synap.auth.dto.AuthDtos.UserDto changeName(long uid, String name) {
        User u = users.findById(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
        u.setDisplayName(name.trim());
        users.save(u);
        return com.synap.auth.dto.AuthDtos.UserDto.from(u);
    }

    /** 비밀번호 변경. 소셜 전용 계정(비번 없음)은 현재 비번 없이 새로 설정 가능. */
    @Transactional
    public void changePassword(long uid, String current, String next) {
        User u = users.findById(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
        if (u.getPasswordHash() != null
                && (current == null || !encoder.matches(current, u.getPasswordHash()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "현재 비밀번호가 올바르지 않아요.");
        }
        u.setPasswordHash(encoder.encode(next));
        users.save(u);
    }

    /** 계정 + 모든 데이터 삭제. RESTRICT FK 순서대로 정리(내가 만든 스페이스는 해체). */
    @Transactional
    public void deleteAccount(long uid) {
        jdbc.update("DELETE FROM space_invite WHERE inviter_id = ?", uid);
        // 내가 소유한 스페이스에 공유된 노트(남의 것 포함)는 개인 노트로 되돌림
        jdbc.update("UPDATE note SET visibility = 'private', space_id = NULL "
                + "WHERE space_id IN (SELECT id FROM space WHERE owner_id = ?)", uid);
        jdbc.update("DELETE FROM space WHERE owner_id = ?", uid);      // cascade: member/invite
        jdbc.update("DELETE FROM note WHERE user_id = ?", uid);        // cascade: note_link/comment
        jdbc.update("DELETE FROM app_user WHERE id = ?", uid);          // cascade: notification/member/invitee/comment-author
    }
}
