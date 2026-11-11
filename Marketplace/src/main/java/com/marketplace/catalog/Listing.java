package com.marketplace.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** One seller's offer of a product. Stock is only changed through ListingRepository's atomic updates. */
@Entity
@Table(name = "listings")
@org.hibernate.annotations.DynamicUpdate // an UPDATE never rewrites stock it didn't change, so it can't undo a concurrent sale
@Getter
@Setter
public class Listing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sellerId;
    private Long productId;
    private BigDecimal price;
    public enum Unit { PCS, KG, LITRE, DOZEN, BOX, CRATE, BAG, PACK }

    private BigDecimal stock;
    @Enumerated(EnumType.STRING)
    private Unit unit = Unit.PCS;     // how this seller counts and prices it
    private BigDecimal reorderLevel;  // low-stock alert; null = app default
    private String sourceNote;
    private boolean active = true;
    private java.time.OffsetDateTime deletedAt; // removed from the shop; kept for history, revived by stocking it again
    private BigDecimal costPrice; // average cost per unit, kept up to date by every receipt; private, used for profit
}
