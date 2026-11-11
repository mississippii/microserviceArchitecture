package com.marketplace.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** A sale made in the physical shop (walk-in customer). Paid on the spot; no platform commission. */
@Entity
@Table(name = "shop_sales")
@Getter
@Setter
public class ShopSale {

    public enum Channel { OFFLINE, ONLINE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sellerId;
    private String buyerName;
    private String buyerPhone;

    @Enumerated(EnumType.STRING)
    private com.marketplace.common.PayMethod paymentMethod; // how the paid part came in

    private Long customerId;          // the shop's customer account; required when part is left to pay later
    private BigDecimal discount = BigDecimal.ZERO;
    private BigDecimal paid;          // paid now; total - paid is the customer's due

    @Enumerated(EnumType.STRING)
    private Channel channel = Channel.OFFLINE;

    private BigDecimal total;         // after discount
    private OffsetDateTime voidedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;
}
