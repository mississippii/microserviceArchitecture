package com.marketplace.books;

import com.marketplace.common.PayMethod;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** A customer paid (part of) their due. */
@Entity
@Table(name = "customer_payments")
@Getter
@Setter
public class CustomerPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sellerId;
    private Long customerId;
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private PayMethod paymentMethod;

    private String note;
    private OffsetDateTime voidedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;
}
