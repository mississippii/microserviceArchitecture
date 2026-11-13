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
    private Long batchId; // the goods on the shelf (catalog): what is left of this line, and its expiry date
}
