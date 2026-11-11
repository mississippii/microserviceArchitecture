package com.marketplace.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "orders")
@Getter
@Setter
public class Order {

    public enum Status {
        PLACED, ACCEPTED, SHIPPED, DELIVERED, CANCELLED;

        private static final Map<Status, Set<Status>> NEXT = Map.of(
                PLACED, Set.of(ACCEPTED, CANCELLED),
                ACCEPTED, Set.of(SHIPPED, CANCELLED),
                SHIPPED, Set.of(DELIVERED),
                DELIVERED, Set.of(),
                CANCELLED, Set.of());

        public boolean canMoveTo(Status next) {
            return NEXT.get(this).contains(next);
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long customerId;
    private Long sellerId;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PLACED;

    private BigDecimal total;
    private String deliveryAddress;
    private String recipientName;  // who receives it (snapshot of the chosen address)
    private String recipientPhone;
    private BigDecimal commissionAmount = BigDecimal.ZERO; // platform's share, fixed at order time
    private Long payoutId;         // the settlement that covered this order, null = not settled yet

    @CreationTimestamp
    private OffsetDateTime createdAt;
}
