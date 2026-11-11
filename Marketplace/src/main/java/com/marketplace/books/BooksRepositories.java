package com.marketplace.books;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findBySellerIdAndPhone(Long sellerId, String phone);

    Optional<Customer> findByIdAndSellerId(Long id, Long sellerId);
}

interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findTop300BySellerIdAndCancelledAtIsNullOrderByIdDesc(Long sellerId);

    Optional<Purchase> findByIdAndSellerId(Long id, Long sellerId);
}

interface PurchaseItemRepository extends JpaRepository<PurchaseItem, Long> {
    List<PurchaseItem> findByPurchaseId(Long purchaseId); // a modifiable list
}

interface CustomerPaymentRepository extends JpaRepository<CustomerPayment, Long> {
    Optional<CustomerPayment> findByIdAndSellerId(Long id, Long sellerId);
}
