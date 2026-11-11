package com.marketplace.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * A settlement between the platform and a seller, recorded once the money has actually moved.
 * amount > 0: platform paid the seller. amount < 0: seller paid the platform (COD commission, refunded orders).
 */
@Entity
@Table(name = "payouts")
@Getter
@Setter
public class Payout {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sellerId;
    private BigDecimal amount;
    private Integer orderCount;
    private String reference;
    private Long createdBy;

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;
}
