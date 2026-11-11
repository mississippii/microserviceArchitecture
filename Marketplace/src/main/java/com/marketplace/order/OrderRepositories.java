package com.marketplace.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerIdOrderByIdDesc(Long customerId);

    List<Order> findBySellerIdOrderByIdDesc(Long sellerId);

    List<Order> findTop300ByOrderByIdDesc();

    List<Order> findByStatusAndPayoutIdIsNull(Order.Status status);

    List<Order> findBySellerIdAndStatusAndPayoutIdIsNull(Long sellerId, Order.Status status);
}

interface ClaimRepository extends JpaRepository<Claim, Long> {
    java.util.Optional<Claim> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);

    /** Open claims first, then newest. */
    @org.springframework.data.jpa.repository.Query("select c from Claim c order by case when c.status = com.marketplace.order.Claim.Status.OPEN then 0 else 1 end, c.id desc")
    List<Claim> findAllOpenFirst();
}

interface OrderEventRepository extends JpaRepository<OrderEvent, Long> {
    List<OrderEvent> findByOrderIdOrderById(Long orderId);
}

interface PayoutRepository extends JpaRepository<Payout, Long> {
    List<Payout> findTop50BySellerIdOrderByIdDesc(Long sellerId);
}

interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);
}

interface ShopSaleRepository extends JpaRepository<ShopSale, Long> {
    List<ShopSale> findTop500BySellerIdOrderByIdDesc(Long sellerId);
    java.util.Optional<ShopSale> findFirstBySellerIdAndBuyerPhoneAndBuyerNameNotNullOrderByIdDesc(Long sellerId, String buyerPhone);
}

interface ShopSaleItemRepository extends JpaRepository<ShopSaleItem, Long> {
    List<ShopSaleItem> findBySaleId(Long saleId);
}
