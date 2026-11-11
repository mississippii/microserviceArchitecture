package com.marketplace.customer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserIdOrderByIsDefaultDescIdAsc(Long userId);

    Optional<Address> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserId(Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Address a set a.isDefault = false where a.userId = :userId and a.isDefault = true")
    int clearDefault(@Param("userId") Long userId);
}

interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserIdOrderById(Long userId);

    Optional<CartItem> findByUserIdAndListingId(Long userId, Long listingId);

    Optional<CartItem> findByIdAndUserId(Long id, Long userId);

    void deleteByUserId(Long userId);
}
