package com.marketplace.customer;

import com.marketplace.catalog.CatalogService;
import com.marketplace.common.Errors;
import com.marketplace.order.Order;
import com.marketplace.order.OrderService;
import com.marketplace.payment.Payment;
import com.marketplace.seller.Seller;
import com.marketplace.seller.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

/** The customer's own things: saved addresses and the cart. */
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final AddressRepository addresses;
    private final CartItemRepository cart;
    private final CatalogService catalog;
    private final SellerService sellerService;
    private final OrderService orderService;

    // ---------- addresses ----------

    public List<Address> addresses(Long userId) {
        return addresses.findByUserIdOrderByIsDefaultDescIdAsc(userId);
    }

    /** id == null creates. The first address, or one saved with makeDefault, becomes the default (only one per customer). */
    @Transactional
    public Address saveAddress(Long userId, Long id, String label, String recipientName, String phone, String address, boolean makeDefault) {
        boolean first = !addresses.existsByUserId(userId);
        if (makeDefault) addresses.clearDefault(userId); // before loading: this query clears the persistence context
        var a = id == null ? new Address() : addresses.findByIdAndUserId(id, userId).orElseThrow(() -> Errors.notFound("address"));
        a.setUserId(userId);
        a.setLabel(label.trim());
        a.setRecipientName(recipientName.trim());
        a.setPhone(phone);
        a.setAddress(address.trim());
        if (makeDefault || first) a.setDefault(true);
        return addresses.save(a);
    }

    @Transactional
    public void deleteAddress(Long userId, Long id) {
        addresses.delete(addresses.findByIdAndUserId(id, userId).orElseThrow(() -> Errors.notFound("address")));
    }

    // ---------- cart ----------

    /** A cart line with everything the page needs. `available` is false when it can't be ordered right now. */
    public record CartLine(Long id, Long listingId, Long productId, String productName, String imageUrl,
                           Long sellerId, String shopName, BigDecimal price, BigDecimal stock, String unit, Integer quantity, boolean available) {}

    public List<CartLine> cart(Long userId) {
        return cart.findByUserIdOrderById(userId).stream().map(i -> {
            var l = catalog.listing(i.getListingId());
            var p = catalog.product(l.getProductId());
            var s = sellerService.get(l.getSellerId());
            boolean ok = l.isActive() && l.getStock().compareTo(BigDecimal.valueOf(i.getQuantity())) >= 0 && s.getStatus() == Seller.Status.VERIFIED;
            return new CartLine(i.getId(), l.getId(), p.getId(), p.getName(), p.getImageUrl(), s.getId(), s.getShopName(),
                    l.getPrice(), l.getStock(), l.getUnit().name(), i.getQuantity(), ok);
        }).toList();
    }

    /** Adds to the existing line if this offer is already in the cart. */
    @Transactional
    public void addToCart(Long userId, Long listingId, int quantity) {
        var l = catalog.listing(listingId);
        if (!l.isActive()) throw Errors.conflict("this offer is no longer available");
        var item = cart.findByUserIdAndListingId(userId, listingId).orElseGet(() -> {
            var n = new CartItem();
            n.setUserId(userId);
            n.setListingId(listingId);
            n.setQuantity(0);
            return n;
        });
        int total = item.getQuantity() + quantity;
        if (BigDecimal.valueOf(total).compareTo(l.getStock()) > 0) throw Errors.conflict("only " + l.getStock().stripTrailingZeros().toPlainString() + " left in stock");
        item.setQuantity(total);
        cart.save(item);
    }

    @Transactional
    public void setQuantity(Long userId, Long itemId, int quantity) {
        var item = cart.findByIdAndUserId(itemId, userId).orElseThrow(() -> Errors.notFound("cart item"));
        var stock = catalog.listing(item.getListingId()).getStock();
        if (BigDecimal.valueOf(quantity).compareTo(stock) > 0) throw Errors.conflict("only " + stock.stripTrailingZeros().toPlainString() + " left in stock");
        item.setQuantity(quantity);
    }

    @Transactional
    public void removeFromCart(Long userId, Long itemId) {
        cart.delete(cart.findByIdAndUserId(itemId, userId).orElseThrow(() -> Errors.notFound("cart item")));
    }

    /**
     * One order per shop (each shop delivers separately), all in ONE transaction:
     * if any line is out of stock nothing is ordered and the cart stays as it was.
     */
    @Transactional
    public List<Order> checkout(Long userId, Long addressId, Payment.Method method) {
        var address = addresses.findByIdAndUserId(addressId, userId).orElseThrow(() -> Errors.notFound("address"));
        var items = cart.findByUserIdOrderById(userId);
        if (items.isEmpty()) throw Errors.badRequest("your cart is empty");
        var byShop = items.stream().collect(Collectors.groupingBy(
                i -> catalog.listing(i.getListingId()).getSellerId(), LinkedHashMap::new, Collectors.toList()));
        var placed = byShop.values().stream().map(lines -> orderService.place(userId,
                lines.stream().map(i -> new OrderService.Line(i.getListingId(), i.getQuantity())).toList(),
                address.getAddress(), method, address.getRecipientName(), address.getPhone())).toList();
        cart.deleteByUserId(userId);
        return placed;
    }
}
