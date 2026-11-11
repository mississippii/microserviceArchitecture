package com.marketplace.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

/** One step in an order's timeline (who moved it to which status, and when). */
@Entity
@Table(name = "order_events")
@Getter
@Setter
public class OrderEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;

    @Enumerated(EnumType.STRING)
    private Order.Status status;

    private Long actorId;

    @CreationTimestamp
    @Column(updatable = false)
    private OffsetDateTime createdAt;
}
