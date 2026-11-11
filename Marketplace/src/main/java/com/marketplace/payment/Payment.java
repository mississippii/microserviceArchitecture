package com.marketplace.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "payments")
@Getter
@Setter
public class Payment {

    public enum Method { COD, BKASH, NAGAD, CARD }

    /** PENDING -> HELD (escrow, customer paid) -> RELEASED (seller paid) | REFUNDED */
    public enum Status { PENDING, HELD, RELEASED, REFUNDED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;

    @Enumerated(EnumType.STRING)
    private Method method;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    private BigDecimal amount;
    private String gatewayRef;
}
