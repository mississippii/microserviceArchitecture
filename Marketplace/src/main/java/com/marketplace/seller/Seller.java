package com.marketplace.seller;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** The DB column "location" (PostGIS) is generated from lat/lng, so it is not mapped here. */
@Entity
@Table(name = "sellers")
@Getter
@Setter
public class Seller {

    public enum Status { PENDING, VERIFIED, SUSPENDED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String shopName;
    private String address;
    private Double lat;
    private Double lng;
    @Column(name = "delivery_radius_m")
    private Integer deliveryRadiusM;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    private BigDecimal qualityScore = BigDecimal.ZERO;

    public enum MobileBanking { BKASH, NAGAD, ROCKET }

    // Identity + where the seller is paid. Private: only the owner and staff ever receive a Seller object.
    private String nidNumber;

    @Enumerated(EnumType.STRING)
    private MobileBanking mobileBankingProvider;
    private String mobileBankingNumber;
    private String bankName;
    private String bankAccountName;
    private String bankAccountNumber;
    private String bankBranch;
}
