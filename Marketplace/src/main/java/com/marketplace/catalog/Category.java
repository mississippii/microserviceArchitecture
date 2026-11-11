package com.marketplace.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "categories")
@Getter
@Setter
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String imageUrl;
    private Long parentId; // null = a top-level group
    private java.math.BigDecimal commissionRate = java.math.BigDecimal.valueOf(8); // % the platform keeps on orders in this category
}
