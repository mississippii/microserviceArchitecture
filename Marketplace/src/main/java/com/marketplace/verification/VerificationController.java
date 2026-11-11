package com.marketplace.verification;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/verifications")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    public record SubmitRequest(@NotBlank @Size(max = 500) String documentUrl) {}

    public record DecisionRequest(@NotNull Boolean approve, @Size(max = 500) String note) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SELLER')")
    public VerificationRequest submit(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SubmitRequest r) {
        return verificationService.submit(Long.valueOf(jwt.getSubject()), r.documentUrl());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('SELLER')")
    public VerificationRequest mine(@AuthenticationPrincipal Jwt jwt) {
        return verificationService.latest(Long.valueOf(jwt.getSubject()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN','VERIFIER')")
    public List<VerificationRequest> pending() {
        return verificationService.pending();
    }

    @PostMapping("/{id}/decision")
    @PreAuthorize("hasAnyRole('ADMIN','VERIFIER')")
    public VerificationRequest decide(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
                                      @Valid @RequestBody DecisionRequest r) {
        return verificationService.decide(id, Long.valueOf(jwt.getSubject()), r.approve(), r.note());
    }
}
