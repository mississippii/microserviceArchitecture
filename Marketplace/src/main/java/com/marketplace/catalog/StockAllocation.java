package com.marketplace.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** What one sale took from one batch, and at what price. */
@Entity
@Table(name = "stock_allocations")
@Getter
@Setter
public class StockAllocation {

    /** refId is the order's id or the shop sale's id. */
    public enum Ref { ORDER, SHOP_SALE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long batchId;

    @Enumerated(EnumType.STRING)
    private Ref refKind;

    private Long refId;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
}
