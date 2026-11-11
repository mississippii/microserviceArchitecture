package com.marketplace.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByOrderId(Long orderId);

    List<Review> findTop50BySellerIdOrderByIdDesc(Long sellerId);

    @Query("select avg(r.rating) from Review r where r.sellerId = :sellerId")
    Double averageRating(Long sellerId);
}
