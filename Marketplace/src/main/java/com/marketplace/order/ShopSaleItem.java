package com.marketplace.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "shop_sale_items")
@Getter
@Setter
public class ShopSaleItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long saleId;
    private Long listingId;
    private BigDecimal quantity; // fractions for loose goods (2.5 kg)
    private BigDecimal unitPrice;
    private BigDecimal unitCost;
}
