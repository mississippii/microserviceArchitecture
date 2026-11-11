package com.marketplace.catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByName(String name);

    boolean existsByParentId(Long parentId);
}

interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByParentId(Long parentId);

    List<Product> findTop500ByNameContainingIgnoreCaseOrderByName(String q);

    List<Product> findTop500ByCategoryIdAndNameContainingIgnoreCaseOrderByName(Long categoryId, String q);

    /** Products in stock at verified sellers that deliver to the customer, with lowest price and seller count. */
    @Query(nativeQuery = true, value = """
            SELECT p.id             AS "id",
                   p.category_id    AS "categoryId",
                   p.name           AS "name",
                   p.origin_region  AS "originRegion",
                   p.image_url      AS "imageUrl",
                   MIN(l.price)     AS "minPrice",
                   CAST(COUNT(DISTINCT s.id) AS integer) AS "sellerCount",
                   CASE WHEN CAST(:lat AS float8) IS NULL THEN NULL ELSE MIN(ST_Distance(s.location, ST_SetSRID(ST_MakePoint(CAST(:lng AS float8), CAST(:lat AS float8)), 4326)::geography)) END AS "nearestM"
            FROM products p
            JOIN listings l ON l.product_id = p.id
            JOIN sellers s ON s.id = l.seller_id
            WHERE l.active
              AND l.stock > 0
              AND s.status = 'VERIFIED'
              AND (CAST(:lat AS float8) IS NULL OR ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(CAST(:lng AS float8), CAST(:lat AS float8)), 4326)::geography, s.delivery_radius_m))
              AND (CAST(:categoryId AS bigint) IS NULL OR p.category_id = CAST(:categoryId AS bigint))
              AND p.name ILIKE ('%' || :q || '%')
            GROUP BY p.id
            ORDER BY "sellerCount" DESC, p.name
            LIMIT 60
            """)
    List<NearbyProduct> findNearby(@Param("lat") Double lat, @Param("lng") Double lng,
                                   @Param("categoryId") Long categoryId, @Param("q") String q);
}

interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findTop50ByListingIdOrderByIdDesc(Long listingId);

    /** The shop's stock register, newest first. */
    @Query("select m from StockMovement m where m.listingId in (select l.id from Listing l where l.sellerId = :sellerId) order by m.id desc")
    List<StockMovement> findForSeller(@Param("sellerId") Long sellerId, org.springframework.data.domain.Pageable page);
}

interface ProductRequestRepository extends JpaRepository<ProductSuggestion, Long> {
    List<ProductSuggestion> findBySellerIdOrderByIdDesc(Long sellerId);

    /** Pending first, then newest. */
    @Query("select r from ProductSuggestion r order by case when r.status = com.marketplace.catalog.ProductSuggestion.Status.PENDING then 0 else 1 end, r.id desc")
    List<ProductSuggestion> findAllPendingFirst();
}

interface ListingRepository extends JpaRepository<Listing, Long> {
    boolean existsByProductId(Long productId);


    Optional<Listing> findBySellerIdAndProductId(Long sellerId, Long productId);

    List<Listing> findBySellerIdOrderById(Long sellerId);

    List<Listing> findBySellerIdAndDeletedAtIsNullOrderById(Long sellerId);

    /** Atomic: decrements only if enough stock. Returns 1 on success, 0 if not enough stock. No overselling. */
    @Modifying
    @Query("update Listing l set l.stock = l.stock - :qty where l.id = :id and l.active = true and l.stock >= :qty")
    int decrementStock(@Param("id") Long id, @Param("qty") java.math.BigDecimal qty);

    /** Counter sale: hidden listings (offline-only stock) can still be sold in the shop. */
    @Modifying
    @Query("update Listing l set l.stock = l.stock - :qty where l.id = :id and l.stock >= :qty")
    int decrementAnyStock(@Param("id") Long id, @Param("qty") java.math.BigDecimal qty);

    @Modifying
    @Query("update Listing l set l.stock = l.stock + :qty where l.id = :id")
    int incrementStock(@Param("id") Long id, @Param("qty") java.math.BigDecimal qty);

    /**
     * Goods received, atomically: stock goes up and the cost becomes the average of what was on the shelf and
     * what came in (every SET reads the old row). A null cost keeps the current one.
     */
    @Modifying
    @Query(nativeQuery = true, value = """
            UPDATE listings SET
              cost_price = CASE WHEN CAST(:cost AS numeric) IS NULL THEN cost_price
                                WHEN stock <= 0 OR cost_price IS NULL THEN CAST(:cost AS numeric)
                                ELSE round((stock * cost_price + :qty * CAST(:cost AS numeric)) / (stock + :qty), 2) END,
              stock = stock + :qty
            WHERE id = :id
            """)
    int receive(@Param("id") Long id, @Param("qty") java.math.BigDecimal qty, @Param("cost") java.math.BigDecimal cost);


    /**
     * Verified sellers that have the product in stock. With a location: only those whose delivery radius covers it, nearest first
     * (GIST index on sellers.location). Without one: all of them, cheapest first.
     */
    @Query(nativeQuery = true, value = """
            SELECT l.id            AS "listingId",
                   s.id            AS "sellerId",
                   s.shop_name     AS "shopName",
                   l.price         AS "price",
                   l.stock         AS "stock",
                   l.unit          AS "unit",
                   l.source_note   AS "sourceNote",
                   s.quality_score AS "qualityScore",
                   CASE WHEN CAST(:lat AS float8) IS NULL THEN NULL ELSE ST_Distance(s.location, ST_SetSRID(ST_MakePoint(CAST(:lng AS float8), CAST(:lat AS float8)), 4326)::geography) END AS "distanceM"
            FROM listings l
            JOIN sellers s ON s.id = l.seller_id
            WHERE l.product_id = :productId
              AND l.active
              AND l.stock > 0
              AND s.status = 'VERIFIED'
              AND (CAST(:lat AS float8) IS NULL OR ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(CAST(:lng AS float8), CAST(:lat AS float8)), 4326)::geography, s.delivery_radius_m))
            ORDER BY "distanceM" NULLS LAST, l.price
            LIMIT 100
            """)
    List<NearbyOffer> findNearby(@Param("productId") Long productId, @Param("lat") Double lat, @Param("lng") Double lng);
}
