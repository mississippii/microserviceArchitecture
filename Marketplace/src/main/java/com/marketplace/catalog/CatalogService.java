package com.marketplace.catalog;

import com.marketplace.activity.ActivityService;
import com.marketplace.common.Errors;
import com.marketplace.seller.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {

    public enum Sort { NEAREST, PRICE, QUALITY }

    private final CategoryRepository categories;
    private final ProductRepository products;
    private final ListingRepository listings;
    private final SellerService sellerService;
    private final StockMovementRepository movements;
    private final StockBatchRepository batches;
    private final StockAllocationRepository allocations;
    private final ProductRequestRepository requests;
    private final ActivityService activity;
    private final jakarta.persistence.EntityManager entityManager;

    // ---------- categories & products (admin-managed) ----------

    public List<Category> categories() {
        return categories.findAll();
    }

    @Transactional
    public Category createCategory(String name, String imageUrl, Long parentId, BigDecimal commissionRate) {
        if (categories.existsByName(name)) throw Errors.conflict("category exists");
        var c = new Category();
        c.setName(name);
        c.setImageUrl(imageUrl);
        c.setParentId(checkedParent(null, parentId));
        if (commissionRate != null) c.setCommissionRate(commissionRate);
        return categories.save(c);
    }

    /** Only two levels: a parent must itself be top-level, and a group that has children can't get a parent. */
    private Long checkedParent(Long selfId, Long parentId) {
        if (parentId == null) return null;
        var parent = categories.findById(parentId).orElseThrow(() -> Errors.notFound("parent group"));
        if (parent.getParentId() != null) throw Errors.badRequest("a group can't be inside another group");
        if (parentId.equals(selfId)) throw Errors.badRequest("a category can't be its own group");
        if (selfId != null && categories.existsByParentId(selfId)) throw Errors.badRequest("this is a group with categories; it can't be moved into another group");
        return parentId;
    }

    @Transactional
    public Category updateCategory(Long id, String name, String imageUrl, Long parentId, BigDecimal commissionRate) {
        var c = categories.findById(id).orElseThrow(() -> Errors.notFound("category"));
        if (!c.getName().equals(name) && categories.existsByName(name)) throw Errors.conflict("category exists");
        c.setName(name);
        c.setImageUrl(imageUrl);
        c.setParentId(checkedParent(id, parentId));
        if (commissionRate != null) c.setCommissionRate(commissionRate);
        return c;
    }

    // ponytail: ILIKE search, capped at 500 (sellers load the whole list); page it and use full-text once the catalogue passes that.
    public List<Product> searchProducts(String q, Long categoryId) {
        var term = q == null ? "" : q.trim();
        return categoryId == null
                ? products.findTop500ByNameContainingIgnoreCaseOrderByName(term)
                : products.findTop500ByCategoryIdAndNameContainingIgnoreCaseOrderByName(categoryId, term);
    }

    public Product product(Long id) {
        return products.findById(id).orElseThrow(() -> Errors.notFound("product"));
    }

    /** Products a customer at (lat,lng) can actually buy, with lowest price and number of sellers. */
    public List<NearbyProduct> nearbyProducts(Double lat, Double lng, Long categoryId, String q) {
        // ponytail: ILIKE on name; move to full-text search when the catalogue is large.
        return products.findNearby(lat, lng, categoryId, q == null ? "" : q.trim());
    }

    /** Only unused products can go: nothing a seller stocks (so no stock or order history breaks), and no varieties left. */
    @Transactional
    public void deleteProduct(Long id) {
        var p = product(id);
        if (products.existsByParentId(id)) throw Errors.conflict("Remove its varieties first, then the product.");
        if (listings.existsByProductId(id)) throw Errors.conflict("Sellers stock " + p.getName() + ", so it can't be removed.");
        try {
            products.delete(p);
            products.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw Errors.conflict(p.getName() + " came from a seller's request, so it can't be removed.");
        }
    }

    @Transactional
    public Product updateProduct(Long id, Long categoryId, Long parentId, String name, String description, String originRegion, String imageUrl) {
        var p = product(id);
        if (parentId != null && products.existsByParentId(id)) throw Errors.badRequest("this product has varieties; it can't become a variety itself");
        return fill(p, categoryId, parentId, name, description, originRegion, imageUrl);
    }

    @Transactional
    public Product createProduct(Long categoryId, Long parentId, String name, String description, String originRegion, String imageUrl) {
        return products.save(fill(new Product(), categoryId, parentId, name, description, originRegion, imageUrl));
    }

    // ponytail: a variety's name holds its parent's name; renaming the parent doesn't rename its varieties.
    private Product fill(Product p, Long categoryId, Long parentId, String name, String description, String originRegion, String imageUrl) {
        name = name.trim();
        if (parentId != null) {
            var parent = product(parentId);
            if (parent.getParentId() != null) throw Errors.badRequest("a variety can't have varieties");
            if (parentId.equals(p.getId())) throw Errors.badRequest("a product can't be its own variety");
            categoryId = parent.getCategoryId(); // a variety lives in its product's category
            var prefix = parent.getName() + " - ";
            if (!name.startsWith(prefix)) name = prefix + name;
        }
        if (!categories.existsById(categoryId)) throw Errors.notFound("category");
        p.setCategoryId(categoryId);
        p.setParentId(parentId);
        p.setName(name);
        p.setDescription(description);
        p.setOriginRegion(originRegion);
        p.setImageUrl(imageUrl);
        return p;
    }

    // ---------- listings (seller-managed) ----------

    /**
     * What a seller sends when setting up or correcting a product. stock = an exact count (a correction),
     * addStock = goods received on top, neither = only price and settings change.
     */
    public record StockChange(Long productId, BigDecimal price, BigDecimal costPrice, Listing.Unit unit, BigDecimal reorderLevel,
                              BigDecimal stock, BigDecimal addStock, String note, String sourceNote, boolean active) {}

    /** Create or update the logged-in seller's offer for a product. Only verified shops can list. */
    @Transactional
    public Listing upsertListing(Long sellerUserId, StockChange c) {
        var shop = sellerService.myVerifiedShop(sellerUserId);
        if (!products.existsById(c.productId())) throw Errors.notFound("product");
        var l = listings.findBySellerIdAndProductId(shop.getId(), c.productId()).orElseGet(Listing::new);
        boolean isNew = l.getId() == null;
        var before = isNew ? BigDecimal.ZERO : l.getStock();
        var unit = c.unit() == null ? (isNew ? Listing.Unit.PCS : l.getUnit()) : c.unit();
        if (!isNew && unit != l.getUnit() && before.signum() != 0) {
            throw Errors.conflict("set the stock to 0 before changing the unit from " + l.getUnit() + " to " + unit);
        }
        l.setDeletedAt(null); // stocking a removed product brings it back
        l.setSellerId(shop.getId());
        l.setProductId(c.productId());
        l.setPrice(c.price());
        l.setUnit(unit);
        l.setReorderLevel(c.reorderLevel());
        l.setSourceNote(c.sourceNote());
        l.setActive(c.active());
        if (isNew) l.setStock(c.stock() == null ? BigDecimal.ZERO : c.stock());
        else if (c.stock() != null) l.setStock(c.stock());
        // A typed cost replaces the average. Received goods are averaged in by receive() instead.
        if (c.addStock() == null && c.costPrice() != null) l.setCostPrice(c.costPrice());
        l = listings.saveAndFlush(l);
        if (c.addStock() != null) {
            receive(l, c.addStock(), c.costPrice(), c.note(), null);
            return l;
        }
        var diff = l.getStock().subtract(before);
        if (diff.signum() != 0) {
            // Opening stock of a new product counts as received; a later correction is a gain or loss at the average cost.
            move(l.getId(), diff, isNew ? StockMovement.Reason.RESTOCK : StockMovement.Reason.ADJUSTMENT, l.getCostPrice(), c.note());
            if (diff.signum() > 0) addBatch(l.getId(), diff, l.getCostPrice(), null);
            else take(l.getId(), diff.negate(), null, null, null);
        }
        return l;
    }

    private static String blankToNull(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }

    /** The seller describes their own offer: photos, a video, a description, the ingredients. */
    @Transactional
    public Listing setDetails(Long sellerUserId, Long listingId, String description, String ingredients, List<String> imageUrls, String videoUrl) {
        var shopId = sellerService.myShop(sellerUserId).getId();
        var l = listings.findById(listingId).filter(x -> x.getSellerId().equals(shopId) && x.getDeletedAt() == null)
                .orElseThrow(() -> Errors.notFound("product"));
        l.setDescription(blankToNull(description));
        l.setIngredients(blankToNull(ingredients));
        l.setImageUrls(imageUrls.toArray(String[]::new));
        l.setVideoUrl(blankToNull(videoUrl));
        return l;
    }

    public record ListingDetails(Long listingId, String description, String ingredients, String[] imageUrls, String videoUrl) {}

    /** Public: only what the seller wrote for customers, and only while the offer is on sale at a verified shop. */
    public ListingDetails listingDetails(Long listingId) {
        var l = listings.findById(listingId).filter(x -> x.isActive() && x.getDeletedAt() == null)
                .filter(x -> sellerService.get(x.getSellerId()).getStatus() == com.marketplace.seller.Seller.Status.VERIFIED)
                .orElseThrow(() -> Errors.notFound("listing " + listingId));
        return new ListingDetails(l.getId(), l.getDescription(), l.getIngredients(), l.getImageUrls(), l.getVideoUrl());
    }

    /**
     * Stock already counted in one unit is recounted in another: 10 crates of 20 kg become 200 kg, and a cost of
     * ৳1,400 a crate becomes ৳70 a kg. perOld = new units in one old unit. The price is given again, per new unit.
     * The product's own history (batches, shipments, shop sales, stock register) is recounted with it, so a later
     * edit, void or report still adds up. Money totals don't change, only how the quantity is written.
     */
    // ponytail: rewrites other modules' rows for this listing in one place (a unit change is one bookkeeping event).
    // Delivered online orders keep their old quantities, so the product-profit report shows those in the new unit's name.
    @Transactional
    public Listing convertUnit(Long sellerUserId, Long listingId, Listing.Unit unit, BigDecimal perOld, BigDecimal price) {
        var shopId = sellerService.myShop(sellerUserId).getId();
        var l = listings.findById(listingId).filter(x -> x.getSellerId().equals(shopId) && x.getDeletedAt() == null)
                .orElseThrow(() -> Errors.notFound("product"));
        if (unit == l.getUnit()) throw Errors.badRequest("it is already counted in " + unit.name().toLowerCase());
        entityManager.refresh(l, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        var open = ((Number) entityManager.createNativeQuery("""
                SELECT COUNT(*) FROM order_items i JOIN orders o ON o.id = i.order_id
                WHERE i.listing_id = :id AND o.status IN ('PLACED', 'ACCEPTED', 'SHIPPED')
                """).setParameter("id", listingId).getSingleResult()).longValue();
        if (open > 0) throw Errors.conflict("finish or cancel this product's open online orders before changing its unit");
        entityManager.flush();
        for (var sql : List.of(
                "UPDATE stock_batches SET received = round(received * :f, 3), remaining = round(remaining * :f, 3), unit_cost = round(unit_cost / :f, 2) WHERE listing_id = :id",
                "UPDATE stock_allocations SET quantity = round(quantity * :f, 3), unit_price = round(unit_price / :f, 2) WHERE batch_id IN (SELECT id FROM stock_batches WHERE listing_id = :id)",
                "UPDATE purchase_items SET quantity = round(quantity * :f, 3), unit_cost = round(unit_cost / :f, 2) WHERE listing_id = :id",
                "UPDATE stock_movements SET change = round(change * :f, 3), unit_cost = round(unit_cost / :f, 2) WHERE listing_id = :id",
                "UPDATE shop_sale_items SET quantity = round(quantity * :f, 3), unit_price = round(unit_price / :f, 2), unit_cost = round(unit_cost / :f, 2) WHERE listing_id = :id",
                // the stock is exactly what its batches hold, so rounding can't pull them apart
                "UPDATE listings SET stock = COALESCE((SELECT SUM(remaining) FROM stock_batches WHERE listing_id = :id), 0), cost_price = round(cost_price / :f, 2), reorder_level = round(reorder_level * :f, 3) WHERE id = :id")) {
            entityManager.createNativeQuery(sql).setParameter("f", perOld).setParameter("id", listingId).executeUpdate();
        }
        entityManager.refresh(l);
        l.setUnit(unit);
        if (price != null && l.getPrice() == null) l.setActive(true); // priced for the first time: it goes on sale, as in setPrice
        l.setPrice(price);
        return l;
    }

    /** A new selling price for one of the shop's products. */
    @Transactional
    public Listing setPrice(Long sellerId, Long listingId, BigDecimal price) {
        var l = listings.findById(listingId).filter(x -> x.getSellerId().equals(sellerId) && x.getDeletedAt() == null)
                .orElseThrow(() -> Errors.notFound("product"));
        if (l.getPrice() == null) l.setActive(true); // priced for the first time: it goes on sale
        l.setPrice(price);
        return l;
    }

    /** The shop's listing of a product, created with this price and unit if it doesn't exist yet. */
    @Transactional
    public Listing listingFor(Long sellerUserId, Long productId, BigDecimal price, Listing.Unit unit) {
        var shop = sellerService.myVerifiedShop(sellerUserId);
        var existing = listings.findBySellerIdAndProductId(shop.getId(), productId);
        if (existing.isPresent() && existing.get().getDeletedAt() == null) return existing.get();
        if (existing.isPresent()) {
            var old = existing.get();
            return upsertListing(sellerUserId, new StockChange(productId, price == null ? old.getPrice() : price, null,
                    unit == null ? old.getUnit() : unit, old.getReorderLevel(), null, null, null, old.getSourceNote(), true));
        }
        // No price yet: the product is in the shop's stock but not on sale online until it gets one.
        return upsertListing(sellerUserId, new StockChange(productId, price, null, unit, null, null, null, null, null, price != null));
    }

    /** Goods received into one of the shop's listings: stock goes up, the average cost follows, and they become a batch (its id is returned). */
    @Transactional
    public Long receiveStock(Long sellerId, Long listingId, BigDecimal qty, BigDecimal unitCost, String note, java.time.LocalDate expiresOn) {
        var l = listing(listingId);
        if (!l.getSellerId().equals(sellerId)) throw Errors.notFound("listing " + listingId);
        return receive(l, qty, unitCost, note, expiresOn).getId();
    }

    private StockBatch receive(Listing l, BigDecimal qty, BigDecimal unitCost, String note, java.time.LocalDate expiresOn) {
        listings.receive(l.getId(), qty, unitCost); // atomic: a sale landing meanwhile isn't overwritten
        move(l.getId(), qty, StockMovement.Reason.RESTOCK, unitCost, note);
        entityManager.refresh(l);
        return addBatch(l.getId(), qty, unitCost != null ? unitCost : l.getCostPrice(), expiresOn);
    }

    // ---------- batches: oldest goods are sold first ----------
    // Every method below runs after the caller has updated the listing row, so its row lock keeps two sales of one product in line.

    private StockBatch addBatch(Long listingId, BigDecimal qty, BigDecimal unitCost, java.time.LocalDate expiresOn) {
        var b = new StockBatch();
        b.setListingId(listingId);
        b.setReceived(qty);
        b.setRemaining(qty);
        b.setUnitCost(unitCost);
        b.setExpiresOn(expiresOn);
        return batches.save(b);
    }

    private static java.time.LocalDate today() {
        return java.time.LocalDate.now(java.time.ZoneId.of("Asia/Dhaka"));
    }

    /** Goods can be sold up to and including their expiry date. */
    private static boolean expired(StockBatch b) {
        return b.getExpiresOn() != null && b.getExpiresOn().isBefore(today());
    }

    /**
     * Goods leave the shelf, oldest batch first. A sale never takes expired goods: if the rest has expired, it is refused.
     * kind = null: not a sale (a count correction), so nothing is recorded against the batch, and expired goods go first.
     */
    private void take(Long listingId, BigDecimal qty, StockAllocation.Ref kind, Long refId, BigDecimal unitPrice) {
        var left = qty;
        var open = new java.util.ArrayList<>(batches.findByListingIdAndRemainingGreaterThanOrderById(listingId, BigDecimal.ZERO));
        if (kind == null) open.sort(Comparator.comparing(b -> !expired(b))); // stable: expired first, then oldest
        for (var b : open) {
            if (left.signum() <= 0) break;
            if (kind != null && expired(b)) continue;
            var n = b.getRemaining().min(left);
            b.setRemaining(b.getRemaining().subtract(n));
            left = left.subtract(n);
            if (kind == null) continue;
            var a = new StockAllocation();
            a.setBatchId(b.getId());
            a.setRefKind(kind);
            a.setRefId(refId);
            a.setQuantity(n);
            a.setUnitPrice(unitPrice);
            allocations.save(a);
        }
        if (kind != null && left.signum() > 0) {
            throw Errors.conflict("only " + qty.subtract(left).stripTrailingZeros().toPlainString() + " of "
                    + product(listing(listingId).getProductId()).getName() + " can be sold; the rest has expired");
        }
    }

    /**
     * Just after midnight: goods past their expiry date come off the shelf as a loss at cost, so nobody can buy them
     * and customers no longer see them in stock. (Between midnight and this job, take() already refuses them.)
     */
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 5 0 * * *", zone = "Asia/Dhaka")
    @Transactional
    public void writeOffExpired() {
        for (var b : batches.findExpired(today())) {
            var l = listing(b.getListingId());
            entityManager.refresh(l, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
            entityManager.refresh(b); // a sale may have taken from it just before the lock
            var gone = b.getRemaining();
            if (gone.signum() == 0) continue;
            l.setStock(l.getStock().subtract(gone).max(BigDecimal.ZERO));
            b.setRemaining(BigDecimal.ZERO);
            move(l.getId(), gone.negate(), StockMovement.Reason.ADJUSTMENT, b.getUnitCost() != null ? b.getUnitCost() : l.getCostPrice(), "Expired");
            if (l.getDeletedAt() != null) continue;
            activity.notify(sellerService.get(l.getSellerId()).getUserId(), "Expired: " + product(l.getProductId()).getName(),
                    gone.stripTrailingZeros().toPlainString() + " " + l.getUnit().name().toLowerCase() + " came off your stock. It can't be sold.",
                    "/seller?tab=stock&product=" + l.getProductId());
        }
    }

    /** A cancelled or voided sale: the goods go back into the batches they came from. Anything unaccounted for becomes a batch of its own. */
    private void giveBack(Listing l, BigDecimal qty, StockAllocation.Ref kind, Long refId) {
        var left = qty;
        for (var a : allocations.findForSale(kind, refId, l.getId())) {
            if (left.signum() <= 0) break;
            var n = a.getQuantity().min(left);
            var b = batches.findById(a.getBatchId()).orElseThrow();
            b.setRemaining(b.getRemaining().add(n));
            left = left.subtract(n);
            if (n.compareTo(a.getQuantity()) == 0) allocations.delete(a);
            else a.setQuantity(a.getQuantity().subtract(n));
        }
        if (left.signum() > 0) addBatch(l.getId(), left, l.getCostPrice(), null);
    }

    /** What sold out of a batch. revenue leaves out online orders refunded to the customer: those goods are gone and earned nothing. */
    public record BatchSales(BigDecimal sold, BigDecimal revenue) {}

    public java.util.Map<Long, BatchSales> batchSales(java.util.Collection<Long> batchIds) {
        var out = new java.util.HashMap<Long, BatchSales>();
        if (batchIds.isEmpty()) return out;
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                SELECT a.batch_id, SUM(a.quantity),
                       COALESCE(SUM(a.quantity * a.unit_price) FILTER (WHERE NOT (a.ref_kind = 'ORDER' AND EXISTS (
                           SELECT 1 FROM payments p WHERE p.order_id = a.ref_id AND p.status = 'REFUNDED'))), 0)
                FROM stock_allocations a WHERE a.batch_id IN (:ids) GROUP BY a.batch_id
                """).setParameter("ids", batchIds).getResultList();
        for (var r : rows) out.put(((Number) r[0]).longValue(), new BatchSales((BigDecimal) r[1], (BigDecimal) r[2]));
        return out;
    }

    public StockBatch batch(Long batchId) {
        return batches.findById(batchId).orElseThrow(() -> Errors.notFound("batch " + batchId));
    }

    /** Every batch with goods left in the seller's shop, oldest first. */
    public List<StockBatch> myBatches(Long sellerUserId) {
        return batches.findOpenForSeller(sellerService.myShop(sellerUserId).getId());
    }

    /** Every morning: tell sellers about goods that expire today or in 3 days. */
    // ponytail: matches exact days, so a morning the server is down is a missed alert; add a notified flag on the batch if that matters.
    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 9 * * *", zone = "Asia/Dhaka")
    @Transactional
    public void expiryAlerts() {
        var today = today();
        for (var b : batches.findExpiringOn(List.of(today, today.plusDays(3)))) {
            var l = listing(b.getListingId());
            if (l.getDeletedAt() != null) continue;
            var left = b.getRemaining().stripTrailingZeros().toPlainString() + " " + l.getUnit().name().toLowerCase();
            activity.notify(sellerService.get(l.getSellerId()).getUserId(),
                    (b.getExpiresOn().equals(today) ? "Expires today: " : "Expires in 3 days: ") + product(l.getProductId()).getName(),
                    left + " left from this shipment.", "/seller?tab=stock&product=" + l.getProductId());
        }
    }

    /**
     * A shipment line was edited, or deleted (newQty 0): the batch, the stock and the average cost move by the difference.
     * Always allowed; goods already gone from the batch stay gone, so only what is left of it can come off the shelf.
     */
    @Transactional
    public void reviseReceipt(Long batchId, BigDecimal newQty, BigDecimal newCost, java.time.LocalDate expiresOn, String note) {
        var b = batch(batchId);
        var l = listing(b.getListingId());
        entityManager.refresh(l, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE); // no sale can land between the read and the write
        if (newCost == null) newCost = b.getUnitCost() != null ? b.getUnitCost() : l.getCostPrice(); // no cost given: nothing changes in value
        var gone = b.getReceived().subtract(b.getRemaining());
        var remaining = newQty.subtract(gone).max(BigDecimal.ZERO);
        var stock = l.getStock();
        var after = stock.subtract(b.getRemaining()).add(remaining).max(BigDecimal.ZERO);
        if (after.signum() > 0 && remaining.signum() > 0 && l.getCostPrice() == null) {
            l.setCostPrice(newCost);
        } else if (after.signum() > 0 && l.getCostPrice() != null && newCost != null) {
            var oldCost = b.getUnitCost() == null ? l.getCostPrice() : b.getUnitCost();
            var value = stock.multiply(l.getCostPrice()).subtract(b.getRemaining().multiply(oldCost)).add(remaining.multiply(newCost));
            l.setCostPrice(value.divide(after, 2, java.math.RoundingMode.HALF_UP).max(BigDecimal.ZERO));
        }
        l.setStock(after);
        var change = after.subtract(stock);
        if (change.signum() != 0) {
            move(l.getId(), change, change.signum() > 0 ? StockMovement.Reason.RESTOCK : StockMovement.Reason.PURCHASE_CANCEL, newCost, note);
        }
        b.setReceived(newQty);
        b.setRemaining(remaining);
        b.setUnitCost(newCost);
        b.setExpiresOn(expiresOn);
    }

    /** The seller takes a product out of the shop. What was left counts as written off at cost; history stays. */
    @Transactional
    public void removeListing(Long sellerUserId, Long listingId) {
        var shopId = sellerService.myShop(sellerUserId).getId();
        var l = listing(listingId);
        if (!l.getSellerId().equals(shopId) || l.getDeletedAt() != null) throw Errors.notFound("listing " + listingId);
        entityManager.refresh(l, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        if (l.getStock().signum() > 0) move(listingId, l.getStock().negate(), StockMovement.Reason.ADJUSTMENT, l.getCostPrice(), "Product removed");
        l.setStock(BigDecimal.ZERO);
        batches.empty(listingId);
        l.setActive(false);
        l.setDeletedAt(java.time.OffsetDateTime.now());
    }

    /** Below this a product is "low" unless the seller set their own level (same default as the Seller Centre). */
    private static final BigDecimal LOW_STOCK = BigDecimal.valueOf(5);

    /** Tell the seller the moment a sale takes a product down to its low-stock level, so restocking isn't left to memory. */
    private void warnIfLow(Listing l, BigDecimal sold) {
        var level = l.getReorderLevel() == null ? LOW_STOCK : l.getReorderLevel();
        var after = l.getStock().subtract(sold);
        if (l.getStock().compareTo(level) <= 0 || after.compareTo(level) > 0) return;
        var name = product(l.getProductId()).getName();
        activity.notify(sellerService.get(l.getSellerId()).getUserId(),
                (after.signum() == 0 ? "Out of stock: " : "Low stock: ") + name,
                after.signum() == 0 ? "Restock it so customers can order again."
                        : after.stripTrailingZeros().toPlainString() + " " + l.getUnit().name().toLowerCase() + " left. Restock it soon.",
                "/seller?tab=stock&product=" + l.getProductId());
    }

    private void move(Long listingId, BigDecimal change, StockMovement.Reason reason) {
        move(listingId, change, reason, null, null);
    }

    private void move(Long listingId, BigDecimal change, StockMovement.Reason reason, BigDecimal unitCost, String note) {
        var m = new StockMovement();
        m.setListingId(listingId);
        m.setChange(change);
        m.setReason(reason);
        m.setUnitCost(unitCost);
        m.setNote(note == null || note.isBlank() ? null : note.trim());
        movements.save(m);
    }

    /** The shop's stock register: every movement of every product, newest first. */
    public List<StockMovement> stockRegister(Long sellerUserId) {
        return movements.findForSeller(sellerService.myShop(sellerUserId).getId(), org.springframework.data.domain.PageRequest.of(0, 300));
    }

    /** Stock history of one of the seller's own listings. */
    public List<StockMovement> stockHistory(Long sellerUserId, Long listingId) {
        var shopId = sellerService.myShop(sellerUserId).getId();
        if (!listing(listingId).getSellerId().equals(shopId)) throw Errors.notFound("listing " + listingId);
        return movements.findTop50ByListingIdOrderByIdDesc(listingId);
    }

    /** Commission % for a product = its category's rate. */
    public BigDecimal commissionRate(Long productId) {
        return categories.findById(product(productId).getCategoryId()).map(Category::getCommissionRate).orElse(BigDecimal.valueOf(8));
    }

    // ---------- product requests (seller asks, admin decides) ----------

    @Transactional
    public ProductSuggestion requestProduct(Long sellerUserId, String name, Long categoryId, String note) {
        var r = new ProductSuggestion();
        r.setSellerId(sellerService.myVerifiedShop(sellerUserId).getId());
        r.setName(name.trim());
        r.setCategoryId(categoryId);
        r.setNote(note);
        return requests.save(r);
    }

    public List<ProductSuggestion> myProductSuggestions(Long sellerUserId) {
        return requests.findBySellerIdOrderByIdDesc(sellerService.myShop(sellerUserId).getId());
    }

    public List<ProductSuggestion> productRequests() {
        return requests.findAllPendingFirst();
    }

    /** Approve = the product is added to the shared catalogue (category required) and the seller can list it. */
    @Transactional
    public ProductSuggestion decideProductSuggestion(Long requestId, boolean approve, Long categoryId, String name, String note) {
        var r = requests.findById(requestId).orElseThrow(() -> Errors.notFound("product request"));
        if (r.getStatus() != ProductSuggestion.Status.PENDING) throw Errors.conflict("request already decided");
        if (approve) {
            var cat = categoryId != null ? categoryId : r.getCategoryId();
            if (cat == null) throw Errors.badRequest("choose a category for the new product");
            var p = createProduct(cat, null, name == null || name.isBlank() ? r.getName() : name.trim(), null, null, null);
            r.setProductId(p.getId());
            r.setCategoryId(cat);
        } else if (note == null || note.isBlank()) {
            throw Errors.badRequest("write a note so the seller knows why");
        }
        r.setStatus(approve ? ProductSuggestion.Status.APPROVED : ProductSuggestion.Status.REJECTED);
        r.setAdminNote(note);
        activity.notify(sellerService.get(r.getSellerId()).getUserId(),
                approve ? "“" + r.getName() + "” was added to the catalogue" : "Product request not accepted",
                approve ? "You can now add your price and stock." : note, "/seller?tab=stock");
        return r;
    }

    public List<Listing> myListings(Long sellerUserId) {
        return listings.findBySellerIdAndDeletedAtIsNullOrderById(sellerService.myShop(sellerUserId).getId());
    }

    // ---------- customer search: nearest / best price / best quality ----------

    // ponytail: sorts the 100 nearest in memory; move ordering into SQL if one area ever has >100 sellers of one product.
    public List<NearbyOffer> offers(Long productId, Double lat, Double lng, Sort sort) {
        var result = listings.findNearby(productId, lat, lng); // already nearest-first
        // without a location there is no distance; ties then fall back to the query's order
        Comparator<NearbyOffer> byDistance = Comparator.comparing(NearbyOffer::getDistanceM, Comparator.nullsLast(Comparator.naturalOrder()));
        return switch (sort) {
            case NEAREST -> lat == null ? result.stream().sorted(Comparator.comparing(NearbyOffer::getPrice)).toList() : result;
            case PRICE -> result.stream().sorted(Comparator.comparing(NearbyOffer::getPrice).thenComparing(byDistance)).toList();
            case QUALITY -> result.stream().sorted(Comparator.comparing(NearbyOffer::getQualityScore).reversed().thenComparing(byDistance)).toList();
        };
    }

    // ---------- used by the order module ----------

    public record ShopItem(Long listingId, Long productId, String name, String imageUrl, String originRegion,
                           BigDecimal price, BigDecimal stock, Listing.Unit unit, String sourceNote) {}

    public record ShopPage(Long id, String shopName, BigDecimal qualityScore, Integer deliveryRadiusM, List<ShopItem> items) {}

    /** Public, shareable shop page: verified shops only, never the address or coordinates. */
    public ShopPage shopPage(Long sellerId) {
        var s = sellerService.get(sellerId);
        if (s.getStatus() != com.marketplace.seller.Seller.Status.VERIFIED) throw Errors.notFound("shop");
        var items = listings.findBySellerIdOrderById(sellerId).stream()
                .filter(Listing::isActive)
                .map(l -> {
                    var p = product(l.getProductId());
                    return new ShopItem(l.getId(), p.getId(), p.getName(), p.getImageUrl(), p.getOriginRegion(), l.getPrice(), l.getStock(), l.getUnit(), l.getSourceNote());
                }).toList();
        return new ShopPage(s.getId(), s.getShopName(), s.getQualityScore(), s.getDeliveryRadiusM(), items);
    }

    public Listing listing(Long listingId) {
        return listings.findById(listingId).orElseThrow(() -> Errors.notFound("listing " + listingId));
    }

    /** Must run inside the caller's transaction so a later failure rolls the stock back too. */
    @Transactional
    public void reserveStock(Long listingId, int qty, Long orderId, BigDecimal unitPrice) {
        var q = BigDecimal.valueOf(qty);
        var l = listing(listingId);
        if (listings.decrementStock(listingId, q) == 0) {
            throw Errors.conflict("not enough stock for listing " + listingId);
        }
        move(listingId, q.negate(), StockMovement.Reason.SALE);
        take(listingId, q, StockAllocation.Ref.ORDER, orderId, unitPrice);
        warnIfLow(l, q);
    }

    @Transactional
    public void releaseStock(Long listingId, int qty, Long orderId) {
        var q = BigDecimal.valueOf(qty);
        listings.incrementStock(listingId, q);
        move(listingId, q, StockMovement.Reason.CANCELLED);
        giveBack(listing(listingId), q, StockAllocation.Ref.ORDER, orderId);
    }

    /** Sold at the counter: the seller's own listing, any visibility. unitPrice is what the line earned per unit, after the sale's discount. */
    @Transactional
    public Listing sellInShop(Long sellerId, Long listingId, BigDecimal qty, Long saleId, BigDecimal unitPrice) {
        var l = listing(listingId);
        if (!l.getSellerId().equals(sellerId)) throw Errors.notFound("listing " + listingId);
        if (listings.decrementAnyStock(listingId, qty) == 0) {
            throw Errors.conflict("only " + l.getStock().stripTrailingZeros().toPlainString() + " left of listing " + listingId);
        }
        move(listingId, qty.negate(), StockMovement.Reason.SHOP_SALE);
        take(listingId, qty, StockAllocation.Ref.SHOP_SALE, saleId, unitPrice);
        warnIfLow(l, qty);
        return l;
    }

    @Transactional
    public void returnFromShopSale(Long listingId, BigDecimal qty, Long saleId) {
        listings.incrementStock(listingId, qty);
        move(listingId, qty, StockMovement.Reason.SHOP_SALE_VOID);
        giveBack(listing(listingId), qty, StockAllocation.Ref.SHOP_SALE, saleId);
    }
}
