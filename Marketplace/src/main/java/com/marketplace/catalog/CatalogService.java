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
        if (c.addStock() != null) return receive(l, c.addStock(), c.costPrice(), c.note());
        var diff = l.getStock().subtract(before);
        if (diff.signum() != 0) {
            // Opening stock of a new product counts as received; a later correction is a gain or loss at the average cost.
            move(l.getId(), diff, isNew ? StockMovement.Reason.RESTOCK : StockMovement.Reason.ADJUSTMENT, l.getCostPrice(), c.note());
        }
        return l;
    }

    /** A new selling price for one of the shop's products. */
    @Transactional
    public Listing setPrice(Long sellerId, Long listingId, BigDecimal price) {
        var l = listings.findById(listingId).filter(x -> x.getSellerId().equals(sellerId) && x.getDeletedAt() == null)
                .orElseThrow(() -> Errors.notFound("product"));
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
        if (price == null) throw Errors.badRequest("set a selling price for " + product(productId).getName());
        return upsertListing(sellerUserId, new StockChange(productId, price, null, unit, null, null, null, null, null, true));
    }

    /** Goods received into one of the shop's listings: stock goes up and the average cost follows. */
    @Transactional
    public Listing receiveStock(Long sellerId, Long listingId, BigDecimal qty, BigDecimal unitCost, String note) {
        var l = listing(listingId);
        if (!l.getSellerId().equals(sellerId)) throw Errors.notFound("listing " + listingId);
        return receive(l, qty, unitCost, note);
    }

    private Listing receive(Listing l, BigDecimal qty, BigDecimal unitCost, String note) {
        listings.receive(l.getId(), qty, unitCost); // atomic: a sale landing meanwhile isn't overwritten
        move(l.getId(), qty, StockMovement.Reason.RESTOCK, unitCost, note);
        entityManager.refresh(l);
        return l;
    }

    /**
     * A purchase line was edited, or deleted (newQty 0): stock and the average cost move by the difference.
     * Always allowed; stock just never goes below 0 (goods already sold stay sold, at the cost they were sold at).
     */
    @Transactional
    public void reviseReceipt(Long listingId, BigDecimal oldQty, BigDecimal oldCost, BigDecimal newQty, BigDecimal newCost, String note) {
        var l = listing(listingId);
        entityManager.refresh(l, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE); // no sale can land between the read and the write
        var stock = l.getStock();
        var left = stock.subtract(oldQty).add(newQty);
        if (left.signum() > 0 && newQty.signum() > 0 && l.getCostPrice() == null) {
            l.setCostPrice(newCost);
        } else if (left.signum() > 0 && l.getCostPrice() != null) {
            var value = stock.multiply(l.getCostPrice()).subtract(oldQty.multiply(oldCost)).add(newQty.multiply(newCost));
            l.setCostPrice(value.divide(left, 2, java.math.RoundingMode.HALF_UP).max(BigDecimal.ZERO));
        }
        var after = left.max(BigDecimal.ZERO);
        l.setStock(after);
        var change = after.subtract(stock);
        if (change.signum() != 0) {
            move(listingId, change, change.signum() > 0 ? StockMovement.Reason.RESTOCK : StockMovement.Reason.PURCHASE_CANCEL, newQty.signum() > 0 ? newCost : oldCost, note);
        }
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
    public void reserveStock(Long listingId, int qty) {
        var q = BigDecimal.valueOf(qty);
        var l = listing(listingId);
        if (listings.decrementStock(listingId, q) == 0) {
            throw Errors.conflict("not enough stock for listing " + listingId);
        }
        move(listingId, q.negate(), StockMovement.Reason.SALE);
        warnIfLow(l, q);
    }

    @Transactional
    public void releaseStock(Long listingId, int qty) {
        var q = BigDecimal.valueOf(qty);
        listings.incrementStock(listingId, q);
        move(listingId, q, StockMovement.Reason.CANCELLED);
    }

    /** Sold at the counter: the seller's own listing, any visibility. */
    @Transactional
    public Listing sellInShop(Long sellerId, Long listingId, BigDecimal qty) {
        var l = listing(listingId);
        if (!l.getSellerId().equals(sellerId)) throw Errors.notFound("listing " + listingId);
        if (listings.decrementAnyStock(listingId, qty) == 0) {
            throw Errors.conflict("only " + l.getStock().stripTrailingZeros().toPlainString() + " left of listing " + listingId);
        }
        move(listingId, qty.negate(), StockMovement.Reason.SHOP_SALE);
        warnIfLow(l, qty);
        return l;
    }

    @Transactional
    public void returnFromShopSale(Long listingId, BigDecimal qty) {
        listings.incrementStock(listingId, qty);
        move(listingId, qty, StockMovement.Reason.SHOP_SALE_VOID);
    }
}
