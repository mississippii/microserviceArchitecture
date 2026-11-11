package com.marketplace.order;

import com.marketplace.auth.AuthService;
import com.marketplace.catalog.CatalogService;
import com.marketplace.seller.SellerService;
import com.marketplace.payment.Payment;
import com.marketplace.payment.PaymentService;
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
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final PaymentService paymentService;
    private final AuthService authService;
    private final CatalogService catalog;
    private final SellerService sellerService;

    public record LineRequest(@NotNull Long listingId, @NotNull @Min(1) @Max(1000) Integer quantity) {}

    public record PlaceOrderRequest(@NotEmpty @Size(max = 50) List<@Valid LineRequest> items,
                                    @NotBlank @Size(max = 300) String deliveryAddress,
                                    @NotNull Payment.Method paymentMethod) {}

    public record StatusRequest(@NotNull Order.Status status) {}

    /** One order line with the product it was for (name + photo), so every screen can show it. */
    public record Item(Long id, Long listingId, Long productId, String productName, String imageUrl, Integer quantity,
                       java.math.BigDecimal unitPrice, java.math.BigDecimal unitCost) {}

    public record OrderDetails(Order order, String shopName, List<Item> items, Payment payment, AuthService.Contact customer,
                               Claim claim, List<OrderEvent> events) {}

    public record SettleRequest(@NotNull Long sellerId, @NotBlank @Size(max = 100) String reference) {}

    public record SellerMoney(OrderService.Balance balance, List<Payout> payouts) {}

    // ponytail: a few small queries per order line; batch with IN queries if a list grows past a few hundred orders.
    private OrderDetails details(Order o) {
        return details(o, false);
    }

    /** forCustomer hides the seller's cost price. */
    private OrderDetails details(Order o, boolean forCustomer) {
        var items = orderService.items(o.getId()).stream().map(i -> {
            var product = catalog.product(catalog.listing(i.getListingId()).getProductId());
            return new Item(i.getId(), i.getListingId(), product.getId(), product.getName(), product.getImageUrl(), i.getQuantity(),
                    i.getUnitPrice(), forCustomer ? null : i.getUnitCost());
        }).toList();
        return new OrderDetails(o, sellerService.get(o.getSellerId()).getShopName(), items,
                paymentService.forOrder(o.getId()), authService.contact(o.getCustomerId()), orderService.claimFor(o.getId()),
                orderService.events(o.getId()));
    }

    private static Long me(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }

    // ----- customer -----

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CUSTOMER')")
    public OrderDetails place(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PlaceOrderRequest r) {
        var lines = r.items().stream().map(i -> new OrderService.Line(i.listingId(), i.quantity())).toList();
        return details(orderService.place(me(jwt), lines, r.deliveryAddress(), r.paymentMethod()), true);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    public List<OrderDetails> myOrders(@AuthenticationPrincipal Jwt jwt) {
        return orderService.customerOrders(me(jwt)).stream().map(o -> details(o, true)).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public OrderDetails get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return details(orderService.customerOrder(me(jwt), id), true);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public Order cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return orderService.customerCancel(me(jwt), id);
    }

    // ----- seller -----

    @GetMapping("/seller")
    @PreAuthorize("hasRole('SELLER')")
    public List<OrderDetails> sellerOrders(@AuthenticationPrincipal Jwt jwt) {
        return orderService.sellerOrders(me(jwt)).stream().map(this::details).toList();
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasRole('SELLER')")
    public Order updateStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody StatusRequest r) {
        return orderService.sellerUpdateStatus(me(jwt), id, r.status());
    }

    @GetMapping("/seller/money")
    @PreAuthorize("hasRole('SELLER')")
    public SellerMoney sellerMoney(@AuthenticationPrincipal Jwt jwt) {
        return new SellerMoney(orderService.myBalance(me(jwt)), orderService.myPayouts(me(jwt)));
    }

    // ----- admin -----

    @GetMapping("/balances")
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderService.Balance> balances() {
        return orderService.balances();
    }

    @PostMapping("/settlements")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public Payout settle(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SettleRequest r) {
        return orderService.settle(me(jwt), r.sellerId(), r.reference().trim());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderDetails> all() {
        return orderService.latest().stream().map(this::details).toList();
    }
}
