package com.marketplace.customer;

import com.marketplace.payment.Payment;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerController {

    private final CustomerService customer;

    public record AddressRequest(@NotBlank @Size(max = 30) String label,
                                 @NotBlank @Size(max = 100) String recipientName,
                                 @NotBlank @Pattern(regexp = "^01[3-9]\\d{8}$", message = "must be a Bangladeshi mobile number") String phone,
                                 @NotBlank @Size(max = 300) String address,
                                 Boolean isDefault) {}

    public record CartAdd(@NotNull Long listingId, @NotNull @Min(1) @Max(1000) Integer quantity) {}

    public record CartQuantity(@NotNull @Min(1) @Max(1000) Integer quantity) {}

    public record CheckoutRequest(@NotNull Long addressId, @NotNull Payment.Method paymentMethod) {}

    public record CheckoutResult(List<Long> orderIds) {}

    private static Long me(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }

    @GetMapping("/api/addresses")
    public List<Address> addresses(@AuthenticationPrincipal Jwt jwt) {
        return customer.addresses(me(jwt));
    }

    @PostMapping("/api/addresses")
    @ResponseStatus(HttpStatus.CREATED)
    public Address addAddress(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AddressRequest r) {
        return customer.saveAddress(me(jwt), null, r.label(), r.recipientName(), r.phone(), r.address(), Boolean.TRUE.equals(r.isDefault()));
    }

    @PutMapping("/api/addresses/{id}")
    public Address updateAddress(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody AddressRequest r) {
        return customer.saveAddress(me(jwt), id, r.label(), r.recipientName(), r.phone(), r.address(), Boolean.TRUE.equals(r.isDefault()));
    }

    @DeleteMapping("/api/addresses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAddress(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        customer.deleteAddress(me(jwt), id);
    }

    @GetMapping("/api/cart")
    public List<CustomerService.CartLine> cart(@AuthenticationPrincipal Jwt jwt) {
        return customer.cart(me(jwt));
    }

    @PostMapping("/api/cart")
    public List<CustomerService.CartLine> add(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CartAdd r) {
        customer.addToCart(me(jwt), r.listingId(), r.quantity());
        return customer.cart(me(jwt));
    }

    @PutMapping("/api/cart/{id}")
    public List<CustomerService.CartLine> quantity(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody CartQuantity r) {
        customer.setQuantity(me(jwt), id, r.quantity());
        return customer.cart(me(jwt));
    }

    @DeleteMapping("/api/cart/{id}")
    public List<CustomerService.CartLine> remove(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        customer.removeFromCart(me(jwt), id);
        return customer.cart(me(jwt));
    }

    @PostMapping("/api/cart/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResult checkout(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CheckoutRequest r) {
        return new CheckoutResult(customer.checkout(me(jwt), r.addressId(), r.paymentMethod()).stream().map(o -> o.getId()).toList());
    }
}
