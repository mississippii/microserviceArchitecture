package com.marketplace.books;

import com.marketplace.catalog.Listing;
import com.marketplace.common.Errors;
import com.marketplace.common.PayMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** The seller's accounts: customers and their dues, purchases, the day book and the summary. */
@RestController
@RequestMapping("/api/books")
@PreAuthorize("hasRole('SELLER')")
@RequiredArgsConstructor
public class BooksController {

    private final BooksService books;
    private final ReportService reports;

    private static Long me(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }

    private static final String PHONE = "^(01[3-9]\\d{8})?$";

    public record CustomerRequest(@NotBlank @Size(max = 100) String name,
                                  @Pattern(regexp = PHONE, message = "must be a Bangladeshi mobile number") String phone,
                                  @Size(max = 300) String address,
                                  @DecimalMin("-9999999999") @DecimalMax("9999999999") @Digits(integer = 10, fraction = 2) BigDecimal openingBalance) {}

    public record PaymentRequest(@NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal amount,
                                 @NotNull PayMethod paymentMethod,
                                 @Size(max = 200) String note) {}

    public record PurchaseLine(@NotNull Long productId,
                               @NotNull @DecimalMin("0.001") @DecimalMax("1000000") @Digits(integer = 9, fraction = 3) BigDecimal quantity,
                               @NotNull @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal unitCost,
                               @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal price,
                               Listing.Unit unit) {}

    public record PurchaseRequest(@NotEmpty @Size(max = 50) List<@Valid PurchaseLine> items,
                                  @NotNull PayMethod paymentMethod,
                                  @Size(max = 200) String note) {}

    // ----- customers -----

    @GetMapping("/customers")
    public List<ReportService.CustomerBalance> customers(@AuthenticationPrincipal Jwt jwt) {
        return reports.customers(me(jwt));
    }

    @PostMapping("/customers")
    @ResponseStatus(HttpStatus.CREATED)
    public Customer addCustomer(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CustomerRequest r) {
        return books.saveCustomer(me(jwt), null, r.name(), r.phone(), r.address(), r.openingBalance());
    }

    @PutMapping("/customers/{id}")
    public Customer updateCustomer(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody CustomerRequest r) {
        return books.saveCustomer(me(jwt), id, r.name(), r.phone(), r.address(), r.openingBalance());
    }

    @GetMapping("/customers/{id}")
    public ReportService.Statement statement(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return reports.statement(me(jwt), id);
    }

    @PostMapping("/customers/{id}/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerPayment pay(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody PaymentRequest r) {
        return books.pay(me(jwt), id, r.amount(), r.paymentMethod(), r.note());
    }

    @PostMapping("/payments/{id}/void")
    public CustomerPayment voidPayment(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return books.voidPayment(me(jwt), id);
    }

    // ----- purchases -----

    @GetMapping("/purchases")
    public List<BooksService.PurchaseView> purchases(@AuthenticationPrincipal Jwt jwt) {
        return books.purchases(me(jwt));
    }

    @PostMapping("/purchases")
    @ResponseStatus(HttpStatus.CREATED)
    public BooksService.PurchaseView purchase(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PurchaseRequest r) {
        var lines = r.items().stream().map(i -> new BooksService.Line(i.productId(), i.quantity(), i.unitCost(), i.price(), i.unit())).toList();
        return books.purchase(me(jwt), lines, r.paymentMethod(), r.note());
    }

    public record LineEdit(@NotNull Long id,
                           @NotNull @DecimalMin("0") @DecimalMax("1000000") @Digits(integer = 9, fraction = 3) BigDecimal quantity,
                           @NotNull @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal unitCost) {}

    public record PurchaseEdit(@NotNull @Size(max = 50) List<@Valid LineEdit> items,
                               @NotNull PayMethod paymentMethod,
                               @Size(max = 200) String note) {}

    @PutMapping("/purchases/{id}")
    public BooksService.PurchaseView editPurchase(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody PurchaseEdit r) {
        return books.editPurchase(me(jwt), id, r.items().stream().map(i -> new BooksService.LineEdit(i.id(), i.quantity(), i.unitCost())).toList(),
                r.paymentMethod(), r.note());
    }

    @DeleteMapping("/purchases/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePurchase(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        books.deletePurchase(me(jwt), id);
    }

    public record CostRequest(@NotNull com.marketplace.seller.Expense.Category category,
                              @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal amount,
                              @NotNull PayMethod paymentMethod,
                              @Size(max = 200) String note) {}

    @PostMapping("/purchases/{id}/costs")
    @ResponseStatus(HttpStatus.CREATED)
    public BooksService.PurchaseView addCost(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody CostRequest r) {
        return books.addCost(me(jwt), id, r.category(), r.amount(), r.paymentMethod(), r.note());
    }

    public record PriceLine(@NotNull Long listingId, @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal price) {}

    @PutMapping("/purchases/{id}/prices")
    public BooksService.PurchaseView setPrices(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @NotEmpty @RequestBody List<@Valid PriceLine> r) {
        return books.setPrices(me(jwt), id, r.stream().map(l -> new BooksService.PriceChange(l.listingId(), l.price())).toList());
    }

    // ----- reports -----

    private static void checkRange(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) throw Errors.badRequest("the start date is after the end date");
        if (from.plusYears(5).isBefore(to)) throw Errors.badRequest("choose at most 5 years");
    }

    @GetMapping("/ledger")
    public List<ReportService.Entry> ledger(@AuthenticationPrincipal Jwt jwt,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        checkRange(from, to);
        return reports.ledger(me(jwt), from, to);
    }

    @GetMapping("/summary")
    public ReportService.Summary summary(@AuthenticationPrincipal Jwt jwt,
                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                         @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        checkRange(from, to);
        return reports.summary(me(jwt), from, to);
    }
}
