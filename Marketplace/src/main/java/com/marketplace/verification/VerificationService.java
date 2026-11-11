package com.marketplace.verification;

import com.marketplace.activity.ActivityService;
import com.marketplace.common.Errors;
import com.marketplace.seller.Seller;
import com.marketplace.seller.SellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VerificationService {

    private final VerificationRepository requests;
    private final SellerService sellerService;
    private final ActivityService activity;

    // ponytail: takes a document URL; add file upload to R2/S3 when sellers can't host docs themselves.
    @Transactional
    public VerificationRequest submit(Long sellerUserId, String documentUrl) {
        var shop = sellerService.myShop(sellerUserId);
        var r = new VerificationRequest();
        r.setSellerId(shop.getId());
        r.setDocumentUrl(documentUrl);
        return requests.save(r);
    }

    public VerificationRequest latest(Long sellerUserId) {
        return requests.findFirstBySellerIdOrderByIdDesc(sellerService.myShop(sellerUserId).getId())
                .orElseThrow(() -> Errors.notFound("verification request"));
    }

    public List<VerificationRequest> pending() {
        return requests.findByStatusOrderByIdAsc(VerificationRequest.Status.PENDING);
    }

    @Transactional
    public VerificationRequest decide(Long requestId, Long reviewerId, boolean approve, String note) {
        var r = requests.findById(requestId).orElseThrow(() -> Errors.notFound("verification request"));
        if (r.getStatus() != VerificationRequest.Status.PENDING) {
            throw Errors.conflict("request already decided");
        }
        r.setStatus(approve ? VerificationRequest.Status.APPROVED : VerificationRequest.Status.REJECTED);
        r.setReviewerId(reviewerId);
        r.setNote(note);
        if (approve) {
            sellerService.setStatus(r.getSellerId(), Seller.Status.VERIFIED);
        }
        activity.audit(reviewerId, approve ? "SELLER_VERIFIED" : "VERIFICATION_REJECTED", "seller", r.getSellerId(), note);
        activity.notify(sellerService.get(r.getSellerId()).getUserId(),
                approve ? "Your shop is verified" : "Your documents were not accepted",
                approve ? "You can now add products and start selling." : note, "/seller");
        return r;
    }
}
