package com.marketplace.catalog;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Shared, comparable product ("Rajshahi Mango - Himsagar, 1kg"). Sellers offer it through Listings. */
@Entity
@Table(name = "products")
@Getter
@Setter
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long categoryId;
    private Long parentId; // set on a variety: আম → হিমসাগর (name is stored in full: "আম - হিমসাগর")
    private String name;
    private String description;
    private String originRegion;
    private String imageUrl;
}
