package com.marketplace.review;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    public record ReviewRequest(@NotNull Long orderId,
                                @NotNull @Min(1) @Max(5) Short rating,
                                @Size(max = 1000) String comment) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CUSTOMER')")
    public Review create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ReviewRequest r) {
        return reviewService.create(Long.valueOf(jwt.getSubject()), r.orderId(), r.rating(), r.comment());
    }

    @GetMapping("/seller/{sellerId}")
    public List<Review> forSeller(@PathVariable Long sellerId) {
        return reviewService.forSeller(sellerId);
    }
}
