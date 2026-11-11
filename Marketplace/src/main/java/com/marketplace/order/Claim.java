package com.marketplace.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

/** A customer's "not original / not as described" claim on a delivered order. Owned by the order module. */
@Entity
@Table(name = "claims")
@Getter
@Setter
public class Claim {

    public enum Reason { NOT_ORIGINAL, NOT_AS_DESCRIBED, DAMAGED }

    public enum Status { OPEN, REFUNDED, REJECTED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;
    private Long customerId;
    private Long sellerId;

    @Enumerated(EnumType.STRING)
    private Reason reason;

    private String details;
    private String evidenceUrl;

    @Enumerated(EnumType.STRING)
    private Status status = Status.OPEN;

    private String resolutionNote;
    private Long reviewerId;

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;

    private OffsetDateTime resolvedAt;
}
