package com.marketplace.books;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "purchase_items")
@Getter
@Setter
public class PurchaseItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long purchaseId;
    private Long listingId;
    private BigDecimal quantity;
    private BigDecimal unitCost;
}
