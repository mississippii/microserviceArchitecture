package com.marketplace.books;

import com.marketplace.catalog.CatalogService;
import com.marketplace.catalog.Listing;
import com.marketplace.common.Errors;
import com.marketplace.common.PayMethod;
import com.marketplace.seller.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * The seller's own books: customers who buy on due, their payments, and purchases of stock.
 * Nothing here stores a balance; ReportService sums them from the rows.
 */
@Service
@RequiredArgsConstructor
public class BooksService {

    private final CustomerRepository customers;
    private final PurchaseRepository purchases;
    private final PurchaseItemRepository purchaseItems;
    private final CustomerPaymentRepository payments;
    private final SellerService sellerService;
    private final CatalogService catalog;

    private static String clean(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }

    private Long shopId(Long userId) {
        return sellerService.myShop(userId).getId();
    }

    // ---------- customers ----------

    /** id == null creates. */
    @Transactional
    public Customer saveCustomer(Long userId, Long id, String name, String phone, String address, BigDecimal opening) {
        var sellerId = shopId(userId);
        var c = id == null ? new Customer() : get(sellerId, id);
        c.setSellerId(sellerId);
        var tel = clean(phone);
        if (tel != null) {
            customers.findBySellerIdAndPhone(sellerId, tel)
                    .filter(other -> !other.getId().equals(c.getId()))
                    .ifPresent(other -> { throw Errors.conflict(other.getName() + " already has this phone number."); });
        }
        c.setName(name.trim());
        c.setPhone(tel);
        c.setAddress(clean(address));
        c.setOpeningBalance(opening == null ? BigDecimal.ZERO : opening);
        return customers.save(c);
    }

    public Customer get(Long sellerId, Long id) {
        return customers.findByIdAndSellerId(id, sellerId).orElseThrow(() -> Errors.notFound("customer"));
    }

    /** Used by shop sales: the chosen customer, or the one with this phone, opened on the spot the first time. */
    @Transactional
    public Customer customerFor(Long sellerId, Long customerId, String phone, String name) {
        if (customerId != null) return get(sellerId, customerId);
        var tel = clean(phone);
        var found = tel == null ? java.util.Optional.<Customer>empty() : customers.findBySellerIdAndPhone(sellerId, tel);
        if (found.isPresent()) return found.get();
        if (clean(name) == null) throw Errors.badRequest("Enter the customer's name.");
        var c = new Customer();
        c.setSellerId(sellerId);
        c.setName(name.trim());
        c.setPhone(tel);
        return customers.save(c);
    }

    /** This shop's customer with the phone, if any (fills in the buyer at the counter). */
    public java.util.Optional<Customer> customerByPhone(Long sellerId, String phone) {
        return customers.findBySellerIdAndPhone(sellerId, phone);
    }

    // ---------- payments: a customer pays their due ----------

    /** Paying more than is owed is allowed: the extra is an advance against the next sale. */
    @Transactional
    public CustomerPayment pay(Long userId, Long customerId, BigDecimal amount, PayMethod method, String note) {
        var sellerId = shopId(userId);
        var p = new CustomerPayment();
        p.setSellerId(sellerId);
        p.setCustomerId(get(sellerId, customerId).getId());
        p.setAmount(amount);
        p.setPaymentMethod(method);
        p.setNote(clean(note));
        return payments.save(p);
    }

    /** Entered by mistake: the payment stops counting, and the due goes back to what it was. */
    @Transactional
    public CustomerPayment voidPayment(Long userId, Long paymentId) {
        var p = payments.findByIdAndSellerId(paymentId, shopId(userId)).orElseThrow(() -> Errors.notFound("payment"));
        if (p.getVoidedAt() != null) throw Errors.conflict("payment is already void");
        p.setVoidedAt(OffsetDateTime.now());
        return p;
    }

    // ---------- purchases: stock comes in, its cost averages in, the money goes out ----------

    /** price and unit are only needed for a product the shop doesn't sell yet. */
    public record Line(Long productId, BigDecimal quantity, BigDecimal unitCost, BigDecimal price, Listing.Unit unit) {}

    /** price and stock are the product's now, in the shop. */
    public record ItemView(Long id, Long listingId, Long productId, String productName, String imageUrl, String unit,
                           BigDecimal quantity, BigDecimal unitCost, BigDecimal price, BigDecimal stock) {}

    /** costs: transport, labour… paid for this shipment; they count as expenses in the accounts. */
    public record PurchaseView(Purchase purchase, List<ItemView> items, List<com.marketplace.seller.Expense> costs) {}

    @Transactional
    public PurchaseView purchase(Long userId, List<Line> lines, PayMethod method, String note) {
        var sellerId = sellerService.myVerifiedShop(userId).getId();
        var p = new Purchase();
        p.setSellerId(sellerId);
        p.setTotal(lines.stream().map(l -> l.quantity().multiply(l.unitCost()))
                .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP));
        p.setPaymentMethod(method);
        p.setNote(clean(note));
        p = purchases.save(p);
        var register = "Purchase #" + p.getId() + (p.getNote() == null ? "" : " · " + p.getNote());
        for (var line : lines) {
            var listing = catalog.listingFor(userId, line.productId(), line.price(), line.unit());
            var item = new PurchaseItem();
            item.setPurchaseId(p.getId());
            item.setListingId(listing.getId());
            item.setQuantity(line.quantity());
            item.setUnitCost(line.unitCost());
            purchaseItems.save(item);
            catalog.receiveStock(sellerId, listing.getId(), line.quantity(), line.unitCost(), register);
        }
        return view(p);
    }

    public List<PurchaseView> purchases(Long userId) {
        return purchases.findTop300BySellerIdAndCancelledAtIsNullOrderByIdDesc(shopId(userId)).stream().map(this::view).toList();
    }

    /** A changed line of a purchase. quantity 0 takes it off the bill. */
    public record LineEdit(Long itemId, BigDecimal quantity, BigDecimal unitCost) {}

    /** Edit a purchase any time: each changed line moves stock and the average cost by the difference. */
    @Transactional
    public PurchaseView editPurchase(Long userId, Long purchaseId, List<LineEdit> edits, PayMethod method, String note) {
        var p = ownPurchase(userId, purchaseId);
        var items = purchaseItems.findByPurchaseId(purchaseId);
        for (var e : edits) {
            var item = items.stream().filter(i -> i.getId().equals(e.itemId())).findFirst()
                    .orElseThrow(() -> Errors.notFound("purchase line " + e.itemId()));
            catalog.reviseReceipt(item.getListingId(), item.getQuantity(), item.getUnitCost(), e.quantity(), e.unitCost(), "Purchase #" + purchaseId + " edited");
            if (e.quantity().signum() == 0) {
                purchaseItems.delete(item);
                items.remove(item);
            } else {
                item.setQuantity(e.quantity());
                item.setUnitCost(e.unitCost());
            }
        }
        if (items.isEmpty()) throw Errors.badRequest("A purchase needs at least one product. Delete the purchase instead.");
        p.setTotal(items.stream().map(i -> i.getQuantity().multiply(i.getUnitCost())).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP));
        p.setPaymentMethod(method);
        p.setNote(clean(note));
        return view(p);
    }

    /** Delete a purchase any time: its goods come off stock (never below 0) and its money stops counting. */
    @Transactional
    public void deletePurchase(Long userId, Long purchaseId) {
        var p = ownPurchase(userId, purchaseId);
        for (var i : purchaseItems.findByPurchaseId(purchaseId)) {
            catalog.reviseReceipt(i.getListingId(), i.getQuantity(), i.getUnitCost(), BigDecimal.ZERO, i.getUnitCost(), "Purchase #" + purchaseId + " deleted");
        }
        sellerService.deleteShipmentCosts(purchaseId); // its costs go with it
        p.setCancelledAt(OffsetDateTime.now());
    }

    @Transactional
    public PurchaseView addCost(Long userId, Long purchaseId, com.marketplace.seller.Expense.Category category, BigDecimal amount,
                                PayMethod method, String note) {
        var p = ownPurchase(userId, purchaseId);
        sellerService.addShipmentCost(p.getSellerId(), p.getId(), category, amount, note, method);
        return view(p);
    }

    public record PriceChange(Long listingId, BigDecimal price) {}

    /** New selling prices for the shipment's products. */
    @Transactional
    public PurchaseView setPrices(Long userId, Long purchaseId, List<PriceChange> changes) {
        var p = ownPurchase(userId, purchaseId);
        var mine = purchaseItems.findByPurchaseId(purchaseId).stream().map(PurchaseItem::getListingId).toList();
        for (var c : changes) {
            if (!mine.contains(c.listingId())) throw Errors.badRequest("product " + c.listingId() + " is not in this shipment");
            catalog.setPrice(p.getSellerId(), c.listingId(), c.price());
        }
        return view(p);
    }

    private Purchase ownPurchase(Long userId, Long purchaseId) {
        var p = purchases.findByIdAndSellerId(purchaseId, shopId(userId)).orElseThrow(() -> Errors.notFound("purchase"));
        if (p.getCancelledAt() != null) throw Errors.notFound("purchase");
        return p;
    }

    // ponytail: a few small queries per purchase line; batch them if the purchase list gets slow.
    private PurchaseView view(Purchase p) {
        return new PurchaseView(p, purchaseItems.findByPurchaseId(p.getId()).stream().map(i -> {
            var l = catalog.listing(i.getListingId());
            var product = catalog.product(l.getProductId());
            return new ItemView(i.getId(), l.getId(), l.getProductId(), product.getName(), product.getImageUrl(), l.getUnit().name(),
                    i.getQuantity(), i.getUnitCost(), l.getPrice(), l.getDeletedAt() == null ? l.getStock() : BigDecimal.ZERO);
        }).toList(), sellerService.shipmentCosts(p.getId()));
    }
}
