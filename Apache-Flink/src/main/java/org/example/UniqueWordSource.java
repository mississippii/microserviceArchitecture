package org.example;

import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.source.RichSourceFunction;

import java.net.InetAddress;
import java.util.UUID;

public class UniqueWordSource extends RichSourceFunction<String> {

    private volatile boolean running = true;
    private int subtaskIndex;
    private String ipAddress;

    @Override
    public void open(Configuration parameters) throws Exception {
        super.open(parameters);
        subtaskIndex = getRuntimeContext().getIndexOfThisSubtask();
        ipAddress = InetAddress.getLocalHost().getHostAddress();
    }

    @Override
    public void run(SourceContext<String> ctx) throws Exception {
        while (running) {
            String uuid = UUID.randomUUID().toString();
            String output = String.format("Task %d | IP %s | UUID %s", subtaskIndex, ipAddress, uuid);
            System.out.println(output);
            ctx.collect(output);
            Thread.sleep(1000);
        }
    }

    @Override
    public void cancel() {
        running = false;
    }
}