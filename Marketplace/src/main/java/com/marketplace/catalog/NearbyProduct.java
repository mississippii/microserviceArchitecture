package com.marketplace.catalog;

import java.math.BigDecimal;

/** A product that verified sellers near the customer have in stock, with its best price (native query projection). */
public interface NearbyProduct {
    Long getId();
    Long getCategoryId();
    String getName();
    String getOriginRegion();
    String getImageUrl();
    BigDecimal getMinPrice();
    Integer getSellerCount();
    Double getNearestM();
}
