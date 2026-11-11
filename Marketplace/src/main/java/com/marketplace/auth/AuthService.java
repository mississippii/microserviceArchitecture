package com.marketplace.auth;

import com.marketplace.common.Errors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;

    @Value("${app.jwt.ttl-hours}")
    private long ttlHours;

    /** Name + phone a seller needs to deliver an order. */
    public record Contact(String name, String phone) {}

    /** Name of the account with this phone, for filling in a buyer. */
    public java.util.Optional<String> nameByPhone(String phone) {
        return users.findByPhone(phone).map(User::getName);
    }

    public Contact contact(Long userId) {
        return users.findById(userId).map(u -> new Contact(u.getName(), u.getPhone())).orElse(null);
    }

    @Transactional
    public User register(String phone, String name, String password, User.Role role, String email) {
        // ADMIN / VERIFIER accounts are created by an admin, never self-registered.
        if (role != User.Role.CUSTOMER && role != User.Role.SELLER) {
            throw Errors.badRequest("role must be CUSTOMER or SELLER");
        }
        if (users.existsByPhone(phone)) {
            throw Errors.conflict("phone already registered");
        }
        var mail = email == null || email.isBlank() ? null : email.trim();
        // A seller is a business: we need an email for agreements, payout statements and account recovery.
        if (role == User.Role.SELLER && mail == null) {
            throw Errors.badRequest("email is required to open a seller account");
        }
        if (mail != null && users.existsByEmailIgnoreCase(mail)) {
            throw Errors.conflict("email already registered");
        }
        var user = new User();
        user.setEmail(mail);
        user.setPhone(phone);
        user.setName(name);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        return users.save(user);
    }

    public record Profile(Long id, String phone, String email, String name, User.Role role) {}

    private User user(Long userId) {
        return users.findById(userId).orElseThrow(() -> Errors.notFound("user"));
    }

    public Profile profile(Long userId) {
        var u = user(userId);
        return new Profile(u.getId(), u.getPhone(), u.getEmail(), u.getName(), u.getRole());
    }

    @Transactional
    public Profile updateProfile(Long userId, String name, String email) {
        var u = user(userId);
        var mail = email == null || email.isBlank() ? null : email.trim();
        if (mail == null && u.getRole() == User.Role.SELLER) {
            throw Errors.badRequest("a seller account needs an email");
        }
        if (mail != null && !mail.equalsIgnoreCase(u.getEmail()) && users.existsByEmailIgnoreCase(mail)) {
            throw Errors.conflict("email already registered");
        }
        u.setName(name.trim());
        u.setEmail(mail);
        return profile(userId);
    }

    @Transactional
    public void changePassword(Long userId, String current, String next) {
        var u = user(userId);
        if (!passwordEncoder.matches(current, u.getPasswordHash())) {
            throw Errors.badRequest("current password is wrong");
        }
        u.setPasswordHash(passwordEncoder.encode(next));
    }

    /** Staff who should hear about things that need a decision (claims, product requests). */
    public List<Long> adminIds() {
        return users.findByRole(User.Role.ADMIN).stream().map(User::getId).toList();
    }

    /** login = phone number or email address. */
    public String login(String login, String password) {
        var id = login.trim();
        var found = id.contains("@") ? users.findByEmailIgnoreCase(id) : users.findByPhone(id);
        var user = found
                .filter(u -> passwordEncoder.matches(password, u.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong mobile number, email or password. Check them and try again."));
        return issueToken(user);
    }

    String issueToken(User user) {
        var now = Instant.now();
        var claims = JwtClaimsSet.builder()
                .subject(user.getId().toString())
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofHours(ttlHours)))
                .claim("roles", List.of(user.getRole().name()))
                .build();
        var header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
