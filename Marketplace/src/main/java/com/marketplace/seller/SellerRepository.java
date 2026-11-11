package com.marketplace.seller;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SellerRepository extends JpaRepository<Seller, Long> {
    Optional<Seller> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    boolean existsByNidNumberAndIdNot(String nidNumber, Long id);
}

interface ExpenseRepository extends JpaRepository<Expense, Long> {
    java.util.List<Expense> findTop500BySellerIdOrderBySpentOnDescIdDesc(Long sellerId);

    java.util.List<Expense> findByPurchaseIdOrderById(Long purchaseId);

    void deleteByPurchaseId(Long purchaseId);
}
