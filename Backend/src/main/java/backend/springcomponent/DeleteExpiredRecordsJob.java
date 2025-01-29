package backend.springcomponent;

import backend.repository.ExpireRecordRepo;
import jakarta.transaction.Transactional;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DeleteExpiredRecordsJob implements Job {
    private final ExpireRecordRepo expireRecordRepo;

    public DeleteExpiredRecordsJob(ExpireRecordRepo expireRecordRepo) {
        this.expireRecordRepo = expireRecordRepo;
    }

    @Override
    @Transactional
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        System.out.println(LocalDateTime.now());
        int deletedRecords = expireRecordRepo.deleteByExpireAtBefore(LocalDateTime.now());
        System.out.println("Deleted " + deletedRecords + " expired records "+LocalDateTime.now());
    }
}
