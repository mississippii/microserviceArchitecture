package com.marketplace.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/** One receipt of goods into a listing. Sales take from the oldest batch first; the listing's stock is the sum of what remains. */
@Entity
@Table(name = "stock_batches")
@Getter
@Setter
public class StockBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long listingId;
    private BigDecimal received;
    private BigDecimal remaining;
    private BigDecimal unitCost; // what was paid per unit; null if the seller never gave a cost
    private LocalDate expiresOn;

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;
}
