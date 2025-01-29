package backend.config;

import backend.springcomponent.DeleteExpiredRecordsJob;
import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;

@Configuration
public class QuartzConfig {
    @Bean
    public JobDetail deleteExpireRecordJobDetail() {
        return JobBuilder
                .newJob(DeleteExpiredRecordsJob.class)
                .withIdentity("deleteExpiredRecordJob")
                .storeDurably()
                .build();
    }
    @Bean
    public Trigger deleteExpireRecordTrigger() {
        return TriggerBuilder
                .newTrigger()
                .forJob(deleteExpireRecordJobDetail())
                .withIdentity("deleteExpiredRecordTrigger")
                .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                        .withIntervalInSeconds(1)
                        .repeatForever()
                        .withMisfireHandlingInstructionFireNow())

                .build();
    }
    @Bean
    public Scheduler quartzScheduler(SchedulerFactoryBean schedulerFactoryBean,
            JobDetail deleteExpireRecordJobDetail,
            Trigger deleteExpireRecordTrigger) throws SchedulerException {
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        scheduler.scheduleJob(deleteExpireRecordJobDetail, deleteExpireRecordTrigger);
        return scheduler;
    }
}
