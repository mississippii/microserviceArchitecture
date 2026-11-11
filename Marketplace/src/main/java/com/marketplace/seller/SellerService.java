package com.marketplace.seller;

import com.marketplace.activity.ActivityService;
import com.marketplace.common.Errors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerRepository sellers;
    private final ExpenseRepository expenses;
    private final ActivityService activity;

    /** Everything a seller must give us. Payout: mobile banking, a bank account, or both. */
    public record ShopData(String shopName, String address, double lat, double lng, int radiusM, String nidNumber,
                           Seller.MobileBanking mobileBankingProvider, String mobileBankingNumber,
                           String bankName, String bankAccountName, String bankAccountNumber, String bankBranch) {}

    private static String clean(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }

    private void apply(Seller s, ShopData d) {
        var mobile = clean(d.mobileBankingNumber());
        var bank = clean(d.bankAccountNumber());
        if (mobile == null && bank == null) {
            throw Errors.badRequest("add a mobile banking number or a bank account so we can pay you");
        }
        if (mobile != null && d.mobileBankingProvider() == null) {
            throw Errors.badRequest("choose bKash, Nagad or Rocket for the mobile banking number");
        }
        if (bank != null && (clean(d.bankName()) == null || clean(d.bankAccountName()) == null)) {
            throw Errors.badRequest("a bank account needs the bank name and the account holder's name");
        }
        s.setShopName(d.shopName().trim());
        s.setAddress(d.address().trim());
        s.setLat(d.lat());
        s.setLng(d.lng());
        s.setDeliveryRadiusM(d.radiusM());
        s.setMobileBankingProvider(mobile == null ? null : d.mobileBankingProvider());
        s.setMobileBankingNumber(mobile);
        s.setBankAccountNumber(bank);
        s.setBankName(bank == null ? null : clean(d.bankName()));
        s.setBankAccountName(bank == null ? null : clean(d.bankAccountName()));
        s.setBankBranch(bank == null ? null : clean(d.bankBranch()));
    }

    private void setNid(Seller s, String nid) {
        if (sellers.existsByNidNumberAndIdNot(nid, s.getId() == null ? -1L : s.getId())) {
            throw Errors.conflict("this NID number is already used by another shop");
        }
        s.setNidNumber(nid);
    }

    @Transactional
    public Seller createShop(Long userId, ShopData d) {
        if (sellers.existsByUserId(userId)) {
            throw Errors.conflict("you already have a shop");
        }
        var s = new Seller();
        s.setUserId(userId);
        apply(s, d);
        setNid(s, d.nidNumber());
        return sellers.save(s);
    }

    public Seller get(Long sellerId) {
        return sellers.findById(sellerId).orElseThrow(() -> Errors.notFound("seller"));
    }

    /** The shop owned by the logged-in user. */
    public Seller myShop(Long userId) {
        return sellers.findByUserId(userId).orElseThrow(() -> Errors.notFound("shop"));
    }

    /** Same as myShop, but the shop must be VERIFIED (required to sell). */
    public Seller myVerifiedShop(Long userId) {
        var s = myShop(userId);
        if (s.getStatus() != Seller.Status.VERIFIED) {
            throw Errors.forbidden("shop is not verified yet");
        }
        return s;
    }

    @Transactional
    public Seller updateShop(Long userId, ShopData d) {
        var s = myShop(userId);
        var payoutBefore = s.getMobileBankingNumber() + "/" + s.getBankAccountNumber();
        apply(s, d);
        if (!d.nidNumber().equals(s.getNidNumber())) {
            // The NID is what staff verified; it can only be corrected before approval.
            if (s.getStatus() != Seller.Status.PENDING) {
                throw Errors.conflict("your NID was verified and can't be changed; contact support");
            }
            setNid(s, d.nidNumber());
        }
        if (!payoutBefore.equals(s.getMobileBankingNumber() + "/" + s.getBankAccountNumber())) {
            activity.audit(userId, "PAYOUT_ACCOUNT_CHANGED", "seller", s.getId(), null);
        }
        return s;
    }

    public java.util.List<Seller> all() {
        return sellers.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
    }

    /** Admin: only a verified shop can be suspended, only a suspended one reinstated. Pending shops go through verification. */
    @Transactional
    public Seller suspend(Long actorId, Long sellerId, boolean suspend) {
        var s = get(sellerId);
        var from = suspend ? Seller.Status.VERIFIED : Seller.Status.SUSPENDED;
        if (s.getStatus() != from) {
            throw Errors.conflict("shop is " + s.getStatus() + ", cannot " + (suspend ? "suspend" : "reinstate"));
        }
        s.setStatus(suspend ? Seller.Status.SUSPENDED : Seller.Status.VERIFIED);
        activity.audit(actorId, suspend ? "SELLER_SUSPENDED" : "SELLER_REINSTATED", "seller", sellerId, null);
        activity.notify(s.getUserId(), suspend ? "Your shop was suspended" : "Your shop is live again",
                suspend ? "Customers can't see your products. Contact support to resolve it." : "Customers can see your products again.", "/seller");
        return s;
    }

    @Transactional
    public void setStatus(Long sellerId, Seller.Status status) {
        get(sellerId).setStatus(status);
    }

    @Transactional
    public void setQualityScore(Long sellerId, BigDecimal score) {
        get(sellerId).setQualityScore(score);
    }

    // ---------- expenses (seller accounts) ----------

    public java.util.List<Expense> expenses(Long userId) {
        return expenses.findTop500BySellerIdOrderBySpentOnDescIdDesc(myShop(userId).getId());
    }

    @Transactional
    public Expense addExpense(Long userId, Expense.Category category, BigDecimal amount, String note, java.time.LocalDate spentOn,
                              com.marketplace.common.PayMethod method) {
        var e = new Expense();
        e.setSellerId(myShop(userId).getId());
        e.setCategory(category);
        e.setAmount(amount);
        e.setNote(clean(note));
        e.setSpentOn(spentOn);
        if (method != null) e.setPaymentMethod(method);
        return expenses.save(e);
    }

    /** A cost paid for one shipment. The caller has checked the purchase is this seller's. */
    @Transactional
    public Expense addShipmentCost(Long sellerId, Long purchaseId, Expense.Category category, BigDecimal amount, String note,
                                   com.marketplace.common.PayMethod method) {
        var e = new Expense();
        e.setSellerId(sellerId);
        e.setPurchaseId(purchaseId);
        e.setCategory(category);
        e.setAmount(amount);
        e.setNote(clean(note));
        e.setSpentOn(java.time.LocalDate.now(java.time.ZoneId.of("Asia/Dhaka")));
        if (method != null) e.setPaymentMethod(method);
        return expenses.save(e);
    }

    public java.util.List<Expense> shipmentCosts(Long purchaseId) {
        return expenses.findByPurchaseIdOrderById(purchaseId);
    }

    @Transactional
    public void deleteShipmentCosts(Long purchaseId) {
        expenses.deleteByPurchaseId(purchaseId);
    }

    @Transactional
    public void deleteExpense(Long userId, Long expenseId) {
        var e = expenses.findById(expenseId)
                .filter(x -> x.getSellerId().equals(myShop(userId).getId()))
                .orElseThrow(() -> Errors.notFound("expense"));
        expenses.delete(e);
    }
}
