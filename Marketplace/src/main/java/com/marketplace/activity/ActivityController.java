package com.marketplace.activity;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activity;

    @GetMapping("/api/notifications")
    public List<Notification> mine(@AuthenticationPrincipal Jwt jwt) {
        return activity.latest(Long.valueOf(jwt.getSubject()));
    }

    @PostMapping("/api/notifications/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void readAll(@AuthenticationPrincipal Jwt jwt) {
        activity.markAllRead(Long.valueOf(jwt.getSubject()));
    }

    @GetMapping("/api/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AuditEntry> audit() {
        return activity.auditTrail();
    }
}
