package com.marketplace.order;

import com.marketplace.activity.ActivityService;
import com.marketplace.auth.AuthService;
import com.marketplace.catalog.CatalogService;
import com.marketplace.common.Errors;
import com.marketplace.payment.Payment;
import com.marketplace.payment.PaymentService;
import com.marketplace.seller.Seller;
import com.marketplace.seller.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orders;
    private final OrderItemRepository items;
    private final CatalogService catalog;
    private final SellerService sellerService;
    private final PaymentService paymentService;
    private final ClaimRepository claims;
    private final OrderEventRepository events;
    private final PayoutRepository payouts;
    private final ActivityService activity;
    private final AuthService authService;

    public record Line(Long listingId, int quantity) {}

    /**
     * One transaction: save the order, reserve stock for every line, save the items, create the payment.
     * Any failure (e.g. out of stock on line 3) rolls back everything, including stock of lines 1-2.
     */
    @Transactional
    public Order place(Long customerId, List<Line> lines, String deliveryAddress, Payment.Method method) {
        return place(customerId, lines, deliveryAddress, method, null, null);
    }

    @Transactional
    public Order place(Long customerId, List<Line> lines, String deliveryAddress, Payment.Method method,
                       String recipientName, String recipientPhone) {
        Long sellerId = null;
        var total = BigDecimal.ZERO;
        var commission = BigDecimal.ZERO;
        var toSave = new java.util.ArrayList<OrderItem>();

        for (var line : lines) {
            var listing = catalog.listing(line.listingId());
            if (sellerId == null) sellerId = listing.getSellerId();
            if (!Objects.equals(sellerId, listing.getSellerId())) {
                throw Errors.badRequest("all items in one order must be from the same seller");
            }
            if (!listing.isActive() || listing.getPrice() == null) throw Errors.conflict("this offer is no longer available");
            var item = new OrderItem();
            item.setListingId(listing.getId());
            item.setQuantity(line.quantity());
            item.setUnitPrice(listing.getPrice());
            item.setUnitCost(listing.getCostPrice());
            toSave.add(item);
            var lineTotal = listing.getPrice().multiply(BigDecimal.valueOf(line.quantity()));
            total = total.add(lineTotal);
            commission = commission.add(lineTotal.multiply(catalog.commissionRate(listing.getProductId())).movePointLeft(2));
        }
        var shop = sellerService.get(sellerId);
        if (shop.getStatus() != Seller.Status.VERIFIED) {
            throw Errors.conflict("seller is not available");
        }

        var order = new Order();
        order.setCustomerId(customerId);
        order.setSellerId(sellerId);
        order.setTotal(total);
        order.setDeliveryAddress(deliveryAddress);
        order.setRecipientName(recipientName);
        order.setRecipientPhone(recipientPhone);
        order.setCommissionAmount(commission.setScale(2, java.math.RoundingMode.HALF_UP));
        order = orders.save(order);

        for (var item : toSave) {
            item.setOrderId(order.getId());
            catalog.reserveStock(item.getListingId(), item.getQuantity(), order.getId(), item.getUnitPrice());
        }
        items.saveAll(toSave);
        paymentService.createForOrder(order.getId(), method, total);
        event(order, customerId);
        activity.notify(shop.getUserId(), "New order #" + order.getId(), "৳" + total.toPlainString() + " · accept it to start", "/seller?tab=orders");
        return order;
    }

    public List<Order> customerOrders(Long customerId) {
        return orders.findByCustomerIdOrderByIdDesc(customerId);
    }

    public List<Order> sellerOrders(Long sellerUserId) {
        return orders.findBySellerIdOrderByIdDesc(sellerService.myShop(sellerUserId).getId());
    }

    public List<Order> latest() {
        return orders.findTop300ByOrderByIdDesc();
    }

    public List<OrderItem> items(Long orderId) {
        return items.findByOrderId(orderId);
    }

    /** Order of the given customer, or 404 (never reveal other customers' orders). */
    public Order customerOrder(Long customerId, Long orderId) {
        return orders.findById(orderId)
                .filter(o -> o.getCustomerId().equals(customerId))
                .orElseThrow(() -> Errors.notFound("order"));
    }

    /** Seller moves the order forward: ACCEPTED -> SHIPPED -> DELIVERED, or CANCELLED. */
    @Transactional
    public Order sellerUpdateStatus(Long sellerUserId, Long orderId, Order.Status next) {
        var shopId = sellerService.myShop(sellerUserId).getId();
        var order = orders.findById(orderId)
                .filter(o -> o.getSellerId().equals(shopId))
                .orElseThrow(() -> Errors.notFound("order"));
        return transition(order, next, sellerUserId);
    }

    private void event(Order order, Long actorId) {
        var e = new OrderEvent();
        e.setOrderId(order.getId());
        e.setStatus(order.getStatus());
        e.setActorId(actorId);
        events.save(e);
    }

    public List<OrderEvent> events(Long orderId) {
        return events.findByOrderIdOrderById(orderId);
    }

    // ----- settlement: what the platform and each seller owe each other -----

    public record Balance(Long sellerId, BigDecimal amount, int orderCount, BigDecimal sales, BigDecimal commission) {}

    /**
     * What one delivered order moves between seller and platform (+ = platform owes the seller).
     * Cash on delivery: the seller holds the cash, so they owe the commission, or the whole amount if we refunded the customer.
     * Prepaid: the platform holds the money, so it owes the seller the total minus commission (nothing if refunded).
     */
    private BigDecimal settlementAmount(Order o) {
        var p = paymentService.forOrder(o.getId());
        boolean refunded = p.getStatus() == Payment.Status.REFUNDED;
        if (p.getMethod() == Payment.Method.COD) {
            return refunded ? o.getTotal().negate() : o.getCommissionAmount().negate();
        }
        return refunded ? BigDecimal.ZERO : o.getTotal().subtract(o.getCommissionAmount());
    }

    /** Delivered, not yet settled, and no claim still open (an open claim could turn into a refund). */
    private List<Order> settleable(List<Order> delivered) {
        return delivered.stream()
                .filter(o -> claims.findByOrderId(o.getId()).map(c -> c.getStatus() != Claim.Status.OPEN).orElse(true))
                .toList();
    }

    private Balance balanceOf(Long sellerId, List<Order> list) {
        return new Balance(sellerId,
                list.stream().map(this::settlementAmount).reduce(BigDecimal.ZERO, BigDecimal::add),
                list.size(),
                list.stream().map(Order::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add),
                list.stream().map(Order::getCommissionAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    public Balance balance(Long sellerId) {
        return balanceOf(sellerId, settleable(orders.findBySellerIdAndStatusAndPayoutIdIsNull(sellerId, Order.Status.DELIVERED)));
    }

    public Balance myBalance(Long sellerUserId) {
        return balance(sellerService.myShop(sellerUserId).getId());
    }

    public List<Payout> myPayouts(Long sellerUserId) {
        return payouts.findTop50BySellerIdOrderByIdDesc(sellerService.myShop(sellerUserId).getId());
    }

    /** Admin: every seller with something to settle. */
    public List<Balance> balances() {
        return settleable(orders.findByStatusAndPayoutIdIsNull(Order.Status.DELIVERED)).stream()
                .collect(java.util.stream.Collectors.groupingBy(Order::getSellerId))
                .entrySet().stream().map(e -> balanceOf(e.getKey(), e.getValue())).toList();
    }

    /** Admin records that the money moved (reference = bKash TrxID / bank reference); the orders are then closed. */
    @Transactional
    public Payout settle(Long adminId, Long sellerId, String reference) {
        var list = settleable(orders.findBySellerIdAndStatusAndPayoutIdIsNull(sellerId, Order.Status.DELIVERED));
        if (list.isEmpty()) throw Errors.conflict("nothing to settle for this seller");
        var b = balanceOf(sellerId, list);
        var p = new Payout();
        p.setSellerId(sellerId);
        p.setAmount(b.amount());
        p.setOrderCount(b.orderCount());
        p.setReference(reference);
        p.setCreatedBy(adminId);
        p = payouts.save(p);
        for (var o : list) o.setPayoutId(p.getId());
        activity.audit(adminId, "SETTLED", "seller", sellerId, b.amount().toPlainString() + " · " + reference);
        activity.notify(sellerService.get(sellerId).getUserId(), "Settlement recorded",
                (b.amount().signum() < 0 ? "You paid ৳" + b.amount().negate().toPlainString() : "We paid you ৳" + b.amount().toPlainString())
                        + " for " + b.orderCount() + " orders · ref " + reference, "/seller?tab=accounts");
        return p;
    }

    // ----- claims ("Not original? Full refund") -----

    @Transactional
    public Claim openClaim(Long customerId, Long orderId, Claim.Reason reason, String details, String evidenceUrl) {
        var order = customerOrder(customerId, orderId);
        if (order.getStatus() != Order.Status.DELIVERED) {
            throw Errors.conflict("you can report a problem once the order is delivered");
        }
        if (claims.existsByOrderId(orderId)) {
            throw Errors.conflict("this order already has an issue reported");
        }
        var c = new Claim();
        c.setOrderId(orderId);
        c.setCustomerId(customerId);
        c.setSellerId(order.getSellerId());
        c.setReason(reason);
        c.setDetails(details);
        c.setEvidenceUrl(evidenceUrl);
        c = claims.save(c);
        activity.notify(sellerService.get(order.getSellerId()).getUserId(), "A customer reported a problem with order #" + orderId,
                "Our team is checking it.", "/seller?tab=orders");
        for (var admin : authService.adminIds()) {
            activity.notify(admin, "New issue on order #" + orderId, details, "/admin?tab=issues");
        }
        return c;
    }

    public Claim claimFor(Long orderId) {
        return claims.findByOrderId(orderId).orElse(null);
    }

    public List<Claim> allClaims() {
        return claims.findAllOpenFirst();
    }

    /** Staff decision. Refund = payment REFUNDED even if already released to the seller. */
    @Transactional
    public Claim decideClaim(Long claimId, Long reviewerId, boolean refund, String note) {
        var c = claims.findById(claimId).orElseThrow(() -> Errors.notFound("issue"));
        if (c.getStatus() != Claim.Status.OPEN) {
            throw Errors.conflict("issue already decided");
        }
        c.setStatus(refund ? Claim.Status.REFUNDED : Claim.Status.REJECTED);
        c.setReviewerId(reviewerId);
        c.setResolutionNote(note);
        c.setResolvedAt(java.time.OffsetDateTime.now());
        if (refund) paymentService.refundClaim(c.getOrderId());
        activity.audit(reviewerId, refund ? "CLAIM_REFUNDED" : "CLAIM_REJECTED", "order", c.getOrderId(), note);
        activity.notify(c.getCustomerId(), refund ? "Refund approved for order #" + c.getOrderId() : "Your report on order #" + c.getOrderId() + " was not accepted", note, "/orders");
        activity.notify(sellerService.get(c.getSellerId()).getUserId(),
                refund ? "Order #" + c.getOrderId() + " was refunded to the customer" : "The issue on order #" + c.getOrderId() + " was rejected", note, "/seller?tab=orders");
        return c;
    }

    /** Customer can cancel only before the seller accepts. */
    @Transactional
    public Order customerCancel(Long customerId, Long orderId) {
        var order = customerOrder(customerId, orderId);
        if (order.getStatus() != Order.Status.PLACED) {
            throw Errors.conflict("order can no longer be cancelled");
        }
        return transition(order, Order.Status.CANCELLED, customerId);
    }

    private static final java.util.Map<Order.Status, String> CUSTOMER_NEWS = java.util.Map.of(
            Order.Status.ACCEPTED, "The seller accepted your order",
            Order.Status.SHIPPED, "Your order is on the way",
            Order.Status.DELIVERED, "Your order was delivered",
            Order.Status.CANCELLED, "Your order was cancelled");

    private Order transition(Order order, Order.Status next, Long actorId) {
        if (!order.getStatus().canMoveTo(next)) {
            throw Errors.conflict("cannot move order from " + order.getStatus() + " to " + next);
        }
        order.setStatus(next);
        switch (next) {
            case DELIVERED -> paymentService.release(order.getId());
            case CANCELLED -> {
                items.findByOrderId(order.getId()).forEach(i -> catalog.releaseStock(i.getListingId(), i.getQuantity(), order.getId()));
                paymentService.refund(order.getId());
            }
            default -> { }
        }
        event(order, actorId);
        if (actorId.equals(order.getCustomerId())) {
            activity.notify(sellerService.get(order.getSellerId()).getUserId(), "Order #" + order.getId() + " was cancelled by the customer",
                    "The stock is back in your products.", "/seller?tab=orders");
        } else {
            activity.notify(order.getCustomerId(), CUSTOMER_NEWS.get(next) + " · #" + order.getId(),
                    next == Order.Status.DELIVERED ? "Rate it, or report it if it isn't original." : null, "/orders");
        }
        return order;
    }
}
