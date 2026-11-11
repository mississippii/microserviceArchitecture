package com.marketplace.verification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VerificationRepository extends JpaRepository<VerificationRequest, Long> {
    List<VerificationRequest> findByStatusOrderByIdAsc(VerificationRequest.Status status);

    java.util.Optional<VerificationRequest> findFirstBySellerIdOrderByIdDesc(Long sellerId);
}
