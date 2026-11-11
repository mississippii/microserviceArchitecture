package com.marketplace.activity;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * In-app notifications and the staff audit trail. Other modules call notify()/audit() inside their own transaction.
 * ponytail: in-app only; send SMS / Web Push from notify() when a gateway account exists.
 */
@Service
@RequiredArgsConstructor
public class ActivityService {

    private final NotificationRepository notifications;
    private final AuditRepository audit;

    @Transactional
    public void notify(Long userId, String title, String body, String link) {
        var n = new Notification();
        n.setUserId(userId);
        n.setTitle(title);
        n.setBody(body);
        n.setLink(link);
        notifications.save(n);
    }

    public List<Notification> latest(Long userId) {
        return notifications.findTop30ByUserIdOrderByIdDesc(userId);
    }

    @Transactional
    public void markAllRead(Long userId) {
        notifications.markAllRead(userId);
    }

    @Transactional
    public void audit(Long actorId, String action, String entity, Long entityId, String details) {
        var a = new AuditEntry();
        a.setActorId(actorId);
        a.setAction(action);
        a.setEntity(entity);
        a.setEntityId(entityId);
        a.setDetails(details);
        audit.save(a);
    }

    public List<AuditEntry> auditTrail() {
        return audit.findTop100ByOrderByIdDesc();
    }
}
