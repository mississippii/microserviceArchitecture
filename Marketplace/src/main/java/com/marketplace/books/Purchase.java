package com.marketplace.books;

import com.marketplace.common.PayMethod;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** Stock the shop bought, paid in full: total is the money out. */
@Entity
@Table(name = "purchases")
@Getter
@Setter
public class Purchase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sellerId;
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    private PayMethod paymentMethod;

    private String note;
    private OffsetDateTime cancelledAt;

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;
}
