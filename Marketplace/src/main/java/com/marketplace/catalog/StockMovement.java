package com.marketplace.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

/** One change to a listing's stock. Rows are only ever added; listings.stock is the running balance. */
@Entity
@Table(name = "stock_movements")
@Getter
@Setter
public class StockMovement {

    public enum Reason { RESTOCK, ADJUSTMENT, SALE, CANCELLED, SHOP_SALE, SHOP_SALE_VOID, PURCHASE_CANCEL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long listingId;
    private java.math.BigDecimal change;
    private java.math.BigDecimal unitCost; // cost per unit: what was paid (received), or the average cost (corrections)
    private String note;                   // supplier, invoice, or why a count was corrected

    @Enumerated(EnumType.STRING)
    private Reason reason;

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;
}
