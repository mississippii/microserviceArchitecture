package com.marketplace.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

/** A seller asks staff to add a product that is missing from the shared catalogue. */
@Entity
@Table(name = "product_requests")
@Getter
@Setter
public class ProductSuggestion {

    public enum Status { PENDING, APPROVED, REJECTED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sellerId;
    private String name;
    private Long categoryId;
    private String note;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    private Long productId;
    private String adminNote;

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;
}
