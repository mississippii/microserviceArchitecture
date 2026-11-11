package com.marketplace.payment;

import com.marketplace.common.Errors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Escrow bookkeeping. No real gateway yet.
 * ponytail: add bKash/Nagad/SSLCommerz callback endpoint that moves PENDING -> HELD when the first online-payment seller goes live.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository payments;

    @Transactional
    public Payment createForOrder(Long orderId, Payment.Method method, BigDecimal amount) {
        var p = new Payment();
        p.setOrderId(orderId);
        p.setMethod(method);
        p.setAmount(amount);
        return payments.save(p);
    }

    public Payment forOrder(Long orderId) {
        return payments.findByOrderId(orderId).orElseThrow(() -> Errors.notFound("payment"));
    }

    /** Order delivered: money goes to the seller (COD collected by courier counts as released too). */
    @Transactional
    public void release(Long orderId) {
        var p = forOrder(orderId);
        if (p.getStatus() == Payment.Status.PENDING || p.getStatus() == Payment.Status.HELD) {
            p.setStatus(Payment.Status.RELEASED);
        }
    }

    /**
     * Upheld claim ("not original"): the customer gets the money back even after release.
     * ponytail: refund comes from the guarantee reserve; deduct it from the seller's next payout once payouts exist.
     */
    @Transactional
    public void refundClaim(Long orderId) {
        forOrder(orderId).setStatus(Payment.Status.REFUNDED);
    }

    /** Order cancelled / not original: give money back if any was taken. */
    @Transactional
    public void refund(Long orderId) {
        var p = forOrder(orderId);
        if (p.getStatus() == Payment.Status.RELEASED) {
            throw Errors.conflict("payment already released to seller; handle as dispute");
        }
        p.setStatus(Payment.Status.REFUNDED);
    }
}
