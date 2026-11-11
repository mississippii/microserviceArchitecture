package com.marketplace.review;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "reviews")
@Getter
@Setter
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;
    private Long customerId;
    private Long sellerId;
    private Short rating;
    private String comment;

    @CreationTimestamp
    private OffsetDateTime createdAt;
}
