package backend.repository;

import backend.entity.ExpiredRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;

@Repository
public interface ExpireRecordRepo extends JpaRepository<ExpiredRecord, Long> {
    int deleteByExpireAtBefore(LocalDateTime now);
}
