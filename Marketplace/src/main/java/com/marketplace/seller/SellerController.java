package com.marketplace.seller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sellers")
@RequiredArgsConstructor
public class SellerController {

    private final SellerService sellerService;

    public record CreateShopRequest(
            @NotBlank @Size(max = 150) String shopName,
            @NotBlank @Size(max = 300) String address,
            @NotNull @DecimalMin("-90") @DecimalMax("90") Double lat,
            @NotNull @DecimalMin("-180") @DecimalMax("180") Double lng,
            @NotNull @Min(100) @Max(100000) Integer deliveryRadiusM,
            @NotBlank @Pattern(regexp = "^(\\d{10}|\\d{13}|\\d{17})$", message = "must be 10, 13 or 17 digits") String nidNumber,
            Seller.MobileBanking mobileBankingProvider,
            @Pattern(regexp = "^(01[3-9]\\d{8})?$", message = "must be a Bangladeshi mobile number") String mobileBankingNumber,
            @Size(max = 100) String bankName,
            @Size(max = 100) String bankAccountName,
            @Pattern(regexp = "^[0-9]{0,30}$", message = "must be digits only") String bankAccountNumber,
            @Size(max = 100) String bankBranch) {

        SellerService.ShopData data() {
            return new SellerService.ShopData(shopName, address, lat, lng, deliveryRadiusM, nidNumber,
                    mobileBankingProvider, mobileBankingNumber, bankName, bankAccountName, bankAccountNumber, bankBranch);
        }
    }

    public record ExpenseRequest(@NotNull Expense.Category category,
                                 @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) java.math.BigDecimal amount,
                                 @Size(max = 200) String note,
                                 @NotNull @PastOrPresent java.time.LocalDate spentOn,
                                 com.marketplace.common.PayMethod paymentMethod) {}

    @GetMapping("/me/expenses")
    @PreAuthorize("hasRole('SELLER')")
    public java.util.List<Expense> expenses(@AuthenticationPrincipal Jwt jwt) {
        return sellerService.expenses(Long.valueOf(jwt.getSubject()));
    }

    @PostMapping("/me/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SELLER')")
    public Expense addExpense(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ExpenseRequest r) {
        return sellerService.addExpense(Long.valueOf(jwt.getSubject()), r.category(), r.amount(), r.note(), r.spentOn(), r.paymentMethod());
    }

    @DeleteMapping("/me/expenses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('SELLER')")
    public void deleteExpense(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        sellerService.deleteExpense(Long.valueOf(jwt.getSubject()), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SELLER')")
    public Seller create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateShopRequest r) {
        return sellerService.createShop(Long.valueOf(jwt.getSubject()), r.data());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('SELLER')")
    public Seller me(@AuthenticationPrincipal Jwt jwt) {
        return sellerService.myShop(Long.valueOf(jwt.getSubject()));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('SELLER')")
    public Seller update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateShopRequest r) {
        return sellerService.updateShop(Long.valueOf(jwt.getSubject()), r.data());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','VERIFIER')")
    public java.util.List<Seller> all() {
        return sellerService.all();
    }

    public record SuspendRequest(@NotNull Boolean suspended) {}

    @PostMapping("/{id}/suspension")
    @PreAuthorize("hasRole('ADMIN')")
    public Seller suspend(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody SuspendRequest r) {
        return sellerService.suspend(Long.valueOf(jwt.getSubject()), id, r.suspended());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','VERIFIER')")
    public Seller get(@PathVariable Long id) {
        return sellerService.get(id);
    }
}
