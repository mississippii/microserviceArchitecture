package com.marketplace.books;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** A customer the shop sells to on due (baki). The account opens by itself the first time a sale is left unpaid. */
@Entity
@Table(name = "customers")
@Getter
@Setter
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sellerId;
    private String name;
    private String phone;
    private String address;
    private BigDecimal openingBalance = BigDecimal.ZERO; // owed before the books started

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;
}
