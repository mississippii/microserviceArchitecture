package org.example;

import org.apache.flink.api.common.serialization.SimpleStringEncoder;
import org.apache.flink.core.fs.Path;
import org.apache.flink.streaming.api.CheckpointingMode;
import org.apache.flink.streaming.api.environment.CheckpointConfig;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.functions.sink.filesystem.StreamingFileSink;
import org.apache.flink.streaming.api.functions.sink.filesystem.bucketassigners.BasePathBucketAssigner;
import org.apache.flink.streaming.api.functions.sink.filesystem.rollingpolicies.DefaultRollingPolicy;

import java.time.Duration;


public class Main {
    public static void main(String[] args) throws Exception {
        final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(6);
        env.enableCheckpointing(10_000L, CheckpointingMode.EXACTLY_ONCE);
        env.getCheckpointConfig().enableExternalizedCheckpoints(
                CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION);

        StreamingFileSink<String> sink = StreamingFileSink
                .forRowFormat(new Path("/opt/flink/checkpoints/output/"), new SimpleStringEncoder<String>("UTF-8"))
                .withBucketAssigner(new BasePathBucketAssigner<>())
                .withRollingPolicy(
                        DefaultRollingPolicy.builder()
                                .withRolloverInterval(Duration.ofSeconds(15))
                                .withInactivityInterval(Duration.ofSeconds(5))
                                .withMaxPartSize(1024 * 1024)
                                .build())
                .build();

        env.addSource(new UniqueWordSource())
                .name("UniqueWordSource")
                .uid("unique-word-source")
                .addSink(sink)
                .name("FileSink")
                .uid("file-sink");

        env.execute("Unique Word Producer with Exactly-Once");
    }
}