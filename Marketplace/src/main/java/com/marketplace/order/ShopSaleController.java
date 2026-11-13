package com.marketplace.order;

import com.marketplace.auth.AuthService;
import com.marketplace.catalog.CatalogService;
import com.marketplace.books.BooksService;
import com.marketplace.common.Errors;
import com.marketplace.common.PayMethod;
import com.marketplace.seller.SellerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;

/** Counter sales: the seller sells from the same stock in the physical shop. */
@RestController
@RequestMapping("/api/shop-sales")
@PreAuthorize("hasRole('SELLER')")
@RequiredArgsConstructor
public class ShopSaleController {

    private final ShopSaleRepository sales;
    private final ShopSaleItemRepository items;
    private final CatalogService catalog;
    private final SellerService sellerService;
    private final AuthService authService;
    private final BooksService books;

    public record LineRequest(@NotNull Long listingId, @NotNull @DecimalMin("0.001") @DecimalMax("100000") @Digits(integer = 9, fraction = 3) BigDecimal quantity,
                              @NotNull @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal unitPrice) {}

    /** paid = null means paid in full. Leaving part to pay later needs a customer: customerId, or the buyer's phone and name. */
    public record SaleRequest(@NotEmpty @Size(max = 50) List<@Valid LineRequest> items,
                              @NotNull PayMethod paymentMethod,
                              ShopSale.Channel channel,
                              @Size(max = 100) String buyerName,
                              @Pattern(regexp = "^(01[3-9]\\d{8})?$", message = "must be a Bangladeshi mobile number") String buyerPhone,
                              Long customerId,
                              @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal discount,
                              @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal paid) {}

    public record Item(Long listingId, Long productId, String productName, String imageUrl, BigDecimal quantity, String unit,
                       BigDecimal unitPrice, BigDecimal unitCost) {}

    public record SaleDetails(ShopSale sale, List<Item> items) {}

    private Long shopId(Jwt jwt) {
        return sellerService.myShop(Long.valueOf(jwt.getSubject())).getId();
    }

    private SaleDetails details(ShopSale s) {
        return new SaleDetails(s, items.findBySaleId(s.getId()).stream().map(i -> {
            var l = catalog.listing(i.getListingId());
            var p = catalog.product(l.getProductId());
            return new Item(i.getListingId(), p.getId(), p.getName(), p.getImageUrl(), i.getQuantity(), l.getUnit().name(), i.getUnitPrice(), i.getUnitCost());
        }).toList());
    }

    /** customerId is set when the phone belongs to one of the shop's customer accounts. */
    public record Buyer(String name, boolean registered, Long customerId) {}

    /** Fill in a buyer from their phone: the shop's customer account first, then a registered user, else this shop's last sale to them. */
    @GetMapping("/buyer")
    public Buyer buyer(@AuthenticationPrincipal Jwt jwt, @RequestParam String phone) {
        var shop = shopId(jwt);
        return books.customerByPhone(shop, phone).map(c -> new Buyer(c.getName(), true, c.getId()))
                .or(() -> authService.nameByPhone(phone).map(n -> new Buyer(n, true, null)))
                .or(() -> sales.findFirstBySellerIdAndBuyerPhoneAndBuyerNameNotNullOrderByIdDesc(shop, phone).map(s -> new Buyer(s.getBuyerName(), false, null)))
                .orElse(new Buyer(null, false, null));
    }

    @GetMapping
    public List<SaleDetails> list(@AuthenticationPrincipal Jwt jwt) {
        return sales.findTop500BySellerIdOrderByIdDesc(shopId(jwt)).stream().map(this::details).toList();
    }

    /** One transaction: any line short of stock rolls the whole sale back. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public SaleDetails sell(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody SaleRequest r) {
        var shopId = shopId(jwt);
        var channel = r.channel() == null ? ShopSale.Channel.OFFLINE : r.channel();
        if (channel == ShopSale.Channel.ONLINE && (r.buyerPhone() == null || r.buyerPhone().isBlank() || r.buyerName() == null || r.buyerName().isBlank()))
            throw Errors.badRequest("An online sale needs the buyer's phone and name.");
        var sale = new ShopSale();
        sale.setChannel(channel);
        sale.setSellerId(shopId);
        sale.setPaymentMethod(r.paymentMethod());
        sale.setBuyerName(r.buyerName() == null || r.buyerName().isBlank() ? null : r.buyerName().trim());
        sale.setBuyerPhone(r.buyerPhone() == null || r.buyerPhone().isBlank() ? null : r.buyerPhone());
        var gross = r.items().stream().map(l -> l.unitPrice().multiply(l.quantity())).reduce(BigDecimal.ZERO, BigDecimal::add);
        var discount = r.discount() == null ? BigDecimal.ZERO : r.discount();
        if (discount.compareTo(gross) > 0) throw Errors.badRequest("The discount can't be more than the sale.");
        var total = gross.subtract(discount).setScale(2, RoundingMode.HALF_UP);
        var paid = r.paid() == null ? total : r.paid();
        if (paid.compareTo(total) > 0) throw Errors.badRequest("Paid can't be more than the total (" + total.toPlainString() + "). Take the rest as a due payment in Customers.");
        // A customer account: chosen, or the buyer's phone. Needed to leave part of the bill to pay later.
        var hasPhone = r.buyerPhone() != null && !r.buyerPhone().isBlank();
        if (paid.compareTo(total) < 0 && r.customerId() == null && !hasPhone)
            throw Errors.badRequest("Add the customer's phone and name to leave a due.");
        if (r.customerId() != null || (hasPhone && (paid.compareTo(total) < 0 || books.customerByPhone(shopId, r.buyerPhone()).isPresent()))) {
            var customer = books.customerFor(shopId, r.customerId(), r.buyerPhone(), r.buyerName());
            sale.setCustomerId(customer.getId());
            sale.setBuyerName(customer.getName());
            sale.setBuyerPhone(customer.getPhone());
        }
        sale.setDiscount(discount);
        sale.setTotal(total);
        sale.setPaid(paid);
        sale = sales.save(sale);
        for (var line : r.items()) {
            // what the line really earned per unit, with the sale's discount spread over the lines
            var net = gross.signum() == 0 ? line.unitPrice() : line.unitPrice().multiply(total).divide(gross, 2, RoundingMode.HALF_UP);
            var listing = catalog.sellInShop(shopId, line.listingId(), line.quantity(), sale.getId(), net);
            var item = new ShopSaleItem();
            item.setSaleId(sale.getId());
            item.setListingId(listing.getId());
            item.setQuantity(line.quantity());
            item.setUnitPrice(line.unitPrice());
            item.setUnitCost(listing.getCostPrice());
            items.save(item);
        }
        return details(sale);
    }

    /** Entered by mistake: mark it void and put the stock back. */
    @PostMapping("/{id}/void")
    @Transactional
    public SaleDetails voidSale(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        var sale = sales.findById(id).filter(s -> s.getSellerId().equals(shopId(jwt))).orElseThrow(() -> Errors.notFound("sale"));
        if (sale.getVoidedAt() != null) throw Errors.conflict("sale is already void");
        sale.setVoidedAt(OffsetDateTime.now());
        items.findBySaleId(id).forEach(i -> catalog.returnFromShopSale(i.getListingId(), i.getQuantity(), id));
        return details(sale);
    }
}
