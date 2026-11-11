package com.marketplace.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** "Not original? Full refund": customers report, staff decide. */
@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final OrderService orderService;

    public record ClaimRequest(@NotNull Long orderId,
                               @NotNull Claim.Reason reason,
                               @NotBlank @Size(max = 1000) String details,
                               @Size(max = 500) @Pattern(regexp = "^https?://.+", message = "must be a link starting with http") String evidenceUrl) {}

    public record DecisionRequest(@NotNull Boolean refund, @NotBlank @Size(max = 500) String note) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CUSTOMER')")
    public Claim open(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ClaimRequest r) {
        var evidence = r.evidenceUrl() == null || r.evidenceUrl().isBlank() ? null : r.evidenceUrl().trim();
        return orderService.openClaim(Long.valueOf(jwt.getSubject()), r.orderId(), r.reason(), r.details().trim(), evidence);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Claim> all() {
        return orderService.allClaims();
    }

    @PostMapping("/{id}/decision")
    @PreAuthorize("hasRole('ADMIN')")
    public Claim decide(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody DecisionRequest r) {
        return orderService.decideClaim(id, Long.valueOf(jwt.getSubject()), r.refund(), r.note().trim());
    }
}
