package com.marketplace.customer;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** A customer's saved delivery address. Orders copy it, so editing it later never changes an old order. */
@Entity
@Table(name = "addresses")
@Getter
@Setter
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String label;
    private String recipientName;
    private String phone;
    private String address;

    @Column(name = "is_default")
    private boolean isDefault;
}
