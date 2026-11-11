package com.marketplace.catalog;

import com.marketplace.common.Errors;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Validated
public class CatalogController {

    private final CatalogService catalog;

    public record CategoryRequest(@NotBlank @Size(max = 100) String name, @Size(max = 500) String imageUrl, Long parentId,
                                  @DecimalMin("0") @DecimalMax("30") BigDecimal commissionRate) {}

    public record NewProductRequest(@NotBlank @Size(max = 200) String name, Long categoryId, @Size(max = 500) String note) {}

    public record RequestDecision(@NotNull Boolean approve, Long categoryId, @Size(max = 200) String name, @Size(max = 500) String note) {}

    public record ProductRequest(@NotNull Long categoryId,
                                 Long parentId, // set to make this a variety of that product
                                 @NotBlank @Size(max = 200) String name,
                                 @Size(max = 2000) String description,
                                 @Size(max = 100) String originRegion,
                                 @Size(max = 500) String imageUrl) {}

    public record ListingRequest(@NotNull Long productId,
                                 @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal price,
                                 @DecimalMin("0") @Digits(integer = 9, fraction = 3) BigDecimal stock,                  // exact count (a correction)
                                 @DecimalMin("0.001") @Digits(integer = 9, fraction = 3) BigDecimal addStock,           // or: goods received, added on top
                                 Listing.Unit unit,
                                 @DecimalMin("0") @Digits(integer = 9, fraction = 3) BigDecimal reorderLevel,
                                 @Size(max = 200) String note,
                                 @Size(max = 500) String sourceNote,
                                 Boolean active,
                                 @DecimalMin("0") @Digits(integer = 10, fraction = 2) BigDecimal costPrice) {}

    // ----- public (GET /api/catalog/** needs no login) -----

    @GetMapping("/api/catalog/categories")
    public List<Category> categories() {
        return catalog.categories();
    }

    @GetMapping("/api/catalog/products")
    public List<Product> products(@RequestParam(required = false) String q, @RequestParam(required = false) Long categoryId) {
        return catalog.searchProducts(q, categoryId);
    }

    /** Products in stock at verified shops, with lowest price. lat/lng are optional: given, only shops that deliver there. */
    @GetMapping("/api/catalog/products/nearby")
    public List<NearbyProduct> nearbyProducts(@RequestParam(required = false) @DecimalMin("-90") @DecimalMax("90") Double lat,
                                              @RequestParam(required = false) @DecimalMin("-180") @DecimalMax("180") Double lng,
                                              @RequestParam(required = false) Long categoryId,
                                              @RequestParam(required = false) String q) {
        if ((lat == null) != (lng == null)) throw com.marketplace.common.Errors.badRequest("give both lat and lng, or neither");
        return catalog.nearbyProducts(lat, lng, categoryId, q);
    }

    @GetMapping("/api/catalog/shops/{id}")
    public CatalogService.ShopPage shop(@PathVariable Long id) {
        return catalog.shopPage(id);
    }

    @GetMapping("/api/catalog/products/{id}")
    public Product product(@PathVariable Long id) {
        return catalog.product(id);
    }

    /** Every verified shop selling the product. lat/lng are optional: given, only shops that deliver there, with distance. */
    @GetMapping("/api/catalog/products/{productId}/offers")
    public List<NearbyOffer> offers(@PathVariable Long productId,
                                    @RequestParam(required = false) @DecimalMin("-90") @DecimalMax("90") Double lat,
                                    @RequestParam(required = false) @DecimalMin("-180") @DecimalMax("180") Double lng,
                                    @RequestParam(defaultValue = "PRICE") CatalogService.Sort sort) {
        if ((lat == null) != (lng == null)) throw com.marketplace.common.Errors.badRequest("give both lat and lng, or neither");
        return catalog.offers(productId, lat, lng, sort);
    }

    // ----- admin -----

    @PostMapping("/api/catalog/categories")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public Category createCategory(@Valid @RequestBody CategoryRequest r) {
        return catalog.createCategory(r.name(), r.imageUrl(), r.parentId(), r.commissionRate());
    }

    @PostMapping("/api/catalog/products")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public Product createProduct(@Valid @RequestBody ProductRequest r) {
        return catalog.createProduct(r.categoryId(), r.parentId(), r.name(), r.description(), r.originRegion(), r.imageUrl());
    }

    @PutMapping("/api/catalog/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Category updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest r) {
        return catalog.updateCategory(id, r.name(), r.imageUrl(), r.parentId(), r.commissionRate());
    }

    @DeleteMapping("/api/catalog/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteProduct(@PathVariable Long id) {
        catalog.deleteProduct(id);
    }

    @PutMapping("/api/catalog/products/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Product updateProduct(@PathVariable Long id, @Valid @RequestBody ProductRequest r) {
        return catalog.updateProduct(id, r.categoryId(), r.parentId(), r.name(), r.description(), r.originRegion(), r.imageUrl());
    }

    // ----- seller -----

    @PutMapping("/api/listings")
    @PreAuthorize("hasRole('SELLER')")
    public Listing upsertListing(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ListingRequest r) {
        if (r.stock() != null && r.addStock() != null) throw Errors.badRequest("give stock (a count) or addStock (goods received), not both");
        return catalog.upsertListing(Long.valueOf(jwt.getSubject()), new CatalogService.StockChange(r.productId(), r.price(), r.costPrice(),
                r.unit(), r.reorderLevel(), r.stock(), r.addStock(), r.note(), r.sourceNote(), r.active() == null || r.active()));
    }

    @DeleteMapping("/api/listings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('SELLER')")
    public void removeListing(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        catalog.removeListing(Long.valueOf(jwt.getSubject()), id);
    }

    @GetMapping("/api/listings/me/movements")
    @PreAuthorize("hasRole('SELLER')")
    public List<StockMovement> stockRegister(@AuthenticationPrincipal Jwt jwt) {
        return catalog.stockRegister(Long.valueOf(jwt.getSubject()));
    }

    @GetMapping("/api/listings/{id}/movements")
    @PreAuthorize("hasRole('SELLER')")
    public List<StockMovement> stockHistory(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return catalog.stockHistory(Long.valueOf(jwt.getSubject()), id);
    }

    @PostMapping("/api/product-requests")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SELLER')")
    public ProductSuggestion requestProduct(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody NewProductRequest r) {
        return catalog.requestProduct(Long.valueOf(jwt.getSubject()), r.name(), r.categoryId(), r.note());
    }

    @GetMapping("/api/product-requests/me")
    @PreAuthorize("hasRole('SELLER')")
    public List<ProductSuggestion> myProductRequests(@AuthenticationPrincipal Jwt jwt) {
        return catalog.myProductSuggestions(Long.valueOf(jwt.getSubject()));
    }

    @GetMapping("/api/product-requests")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ProductSuggestion> productRequests() {
        return catalog.productRequests();
    }

    @PostMapping("/api/product-requests/{id}/decision")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductSuggestion decideProductRequest(@PathVariable Long id, @Valid @RequestBody RequestDecision r) {
        return catalog.decideProductSuggestion(id, r.approve(), r.categoryId(), r.name(), r.note());
    }

    @GetMapping("/api/listings/me")
    @PreAuthorize("hasRole('SELLER')")
    public List<Listing> myListings(@AuthenticationPrincipal Jwt jwt) {
        return catalog.myListings(Long.valueOf(jwt.getSubject()));
    }
}
