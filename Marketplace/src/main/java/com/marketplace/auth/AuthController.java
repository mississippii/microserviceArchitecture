package com.marketplace.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    public record RegisterRequest(
            @NotBlank @Pattern(regexp = "^01[3-9]\\d{8}$", message = "must be a Bangladeshi mobile number") String phone,
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotNull User.Role role,
            @Email @Size(max = 150) String email) {}

    public record ProfileRequest(@NotBlank @Size(max = 100) String name, @Email @Size(max = 150) String email) {}

    public record PasswordRequest(@NotBlank String current, @NotBlank @Size(min = 8, max = 72) String next) {}

    /** login = phone number or email address */
    public record LoginRequest(@NotBlank String login, @NotBlank String password) {}

    public record UserResponse(Long id, String phone, String name, User.Role role) {}

    public record TokenResponse(String token) {}

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest req) {
        var u = authService.register(req.phone(), req.name(), req.password(), req.role(), req.email());
        return new UserResponse(u.getId(), u.getPhone(), u.getName(), u.getRole());
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest req) {
        return new TokenResponse(authService.login(req.login(), req.password()));
    }

    // /api/auth/** is public in SecurityConfig, so these check the token themselves.
    private static Long uid(Jwt jwt) {
        if (jwt == null) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED, "log in first");
        return Long.valueOf(jwt.getSubject());
    }

    @GetMapping("/me")
    public AuthService.Profile me(@AuthenticationPrincipal Jwt jwt) {
        return authService.profile(uid(jwt));
    }

    @PutMapping("/me")
    public AuthService.Profile update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ProfileRequest r) {
        return authService.updateProfile(uid(jwt), r.name(), r.email());
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void password(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PasswordRequest r) {
        authService.changePassword(uid(jwt), r.current(), r.next());
    }
}
