package com.marketplace.catalog;

import java.math.BigDecimal;

/** One row of the "who sells this near me" search (native query projection). */
public interface NearbyOffer {
    Long getListingId();
    Long getSellerId();
    String getShopName();
    BigDecimal getPrice();
    BigDecimal getStock();
    String getUnit();
    String getSourceNote();
    BigDecimal getQualityScore();
    Double getDistanceM();
}
