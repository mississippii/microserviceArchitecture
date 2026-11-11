package com.marketplace.seller;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/** A business cost the seller records (rent, transport…). Sales − product cost − commission − expenses = profit. */
@Entity
@Table(name = "expenses")
@Getter
@Setter
public class Expense {

    public enum Category { RENT, TRANSPORT, PACKAGING, SALARY, UTILITIES, MARKETING, OTHER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sellerId;

    @Enumerated(EnumType.STRING)
    private Category category;

    private BigDecimal amount;
    private String note;
    private LocalDate spentOn;
    private Long purchaseId; // a shipment cost, or null for a shop expense

    @Enumerated(EnumType.STRING)
    private com.marketplace.common.PayMethod paymentMethod = com.marketplace.common.PayMethod.CASH;
}
