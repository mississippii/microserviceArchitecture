package com.marketplace.review;

import com.marketplace.common.Errors;
import com.marketplace.order.Order;
import com.marketplace.order.OrderService;
import com.marketplace.seller.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviews;
    private final OrderService orderService;
    private final SellerService sellerService;

    /** Only the buyer of a DELIVERED order can review it, once. = verified-purchase reviews only. */
    @Transactional
    public Review create(Long customerId, Long orderId, short rating, String comment) {
        var order = orderService.customerOrder(customerId, orderId);
        if (order.getStatus() != Order.Status.DELIVERED) {
            throw Errors.conflict("you can review only delivered orders");
        }
        if (reviews.existsByOrderId(orderId)) {
            throw Errors.conflict("order already reviewed");
        }
        var r = new Review();
        r.setOrderId(orderId);
        r.setCustomerId(customerId);
        r.setSellerId(order.getSellerId());
        r.setRating(rating);
        r.setComment(comment);
        reviews.saveAndFlush(r);

        // ponytail: quality score = average rating x 20 (0-100); add fulfilment/complaint rates when that data exists.
        var avg = reviews.averageRating(order.getSellerId());
        sellerService.setQualityScore(order.getSellerId(),
                BigDecimal.valueOf(avg).multiply(BigDecimal.valueOf(20)).setScale(2, RoundingMode.HALF_UP));
        return r;
    }

    public List<Review> forSeller(Long sellerId) {
        return reviews.findTop50BySellerIdOrderByIdDesc(sellerId);
    }
}
