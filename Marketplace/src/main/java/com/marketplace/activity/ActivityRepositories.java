package com.marketplace.activity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop30ByUserIdOrderByIdDesc(Long userId);

    @Modifying
    @Query("update Notification n set n.readAt = CURRENT_TIMESTAMP where n.userId = :userId and n.readAt is null")
    int markAllRead(@Param("userId") Long userId);
}

interface AuditRepository extends JpaRepository<AuditEntry, Long> {
    List<AuditEntry> findTop100ByOrderByIdDesc();
}
