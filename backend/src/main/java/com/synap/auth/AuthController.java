package com.synap.auth;

import com.synap.auth.dto.AuthDtos.AuthResponse;
import com.synap.auth.dto.AuthDtos.LoginRequest;
import com.synap.auth.dto.AuthDtos.NameChangeRequest;
import com.synap.auth.dto.AuthDtos.PasswordChangeRequest;
import com.synap.auth.dto.AuthDtos.RegisterRequest;
import com.synap.auth.dto.AuthDtos.UserDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AccountService account;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt, AccountService account) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.account = account;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다.");
        }
        User user = users.save(new User(email, encoder.encode(req.password()), req.displayName().trim()));
        return new AuthResponse(jwt.issue(user), UserDto.from(user));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        User user = users.findByEmail(req.email().trim().toLowerCase())
                .filter(u -> encoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."));
        return new AuthResponse(jwt.issue(user), UserDto.from(user));
    }

    @GetMapping("/me")
    public UserDto me() {
        return users.findById(CurrentUser.id())
                .map(UserDto::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
    }

    @PostMapping("/name")
    public UserDto changeName(@Valid @RequestBody NameChangeRequest req) {
        return account.changeName(CurrentUser.id(), req.displayName());
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody PasswordChangeRequest req) {
        account.changePassword(CurrentUser.id(), req.currentPassword(), req.newPassword());
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount() {
        account.deleteAccount(CurrentUser.id());
    }
}
