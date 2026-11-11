package com.marketplace.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@Setter
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;
    private Long listingId;
    private Integer quantity;
    private BigDecimal unitPrice; // snapshot: later price changes don't affect this order
    private BigDecimal unitCost;  // seller's cost at order time (may be null); never shown to customers
}
