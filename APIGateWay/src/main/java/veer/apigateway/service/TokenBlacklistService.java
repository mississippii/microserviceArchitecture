package veer.apigateway.service;

import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

@Service
public class TokenBlacklistService {

    private static final String PREFIX = "blacklist:";
    private final ReactiveStringRedisTemplate redisTemplate;

    public TokenBlacklistService(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public Mono<Boolean> isBlacklisted(String jti) {
        if (jti == null || jti.isBlank()) {
            return Mono.just(false);
        }
        return redisTemplate.hasKey(PREFIX + jti)
                .map(Boolean::booleanValue)
                .onErrorReturn(false);
    }

    public Mono<Boolean> blacklist(String jti, Instant expiresAt) {
        if (jti == null || jti.isBlank() || expiresAt == null) {
            return Mono.just(false);
        }
        long ttlSeconds = Duration.between(Instant.now(), expiresAt).getSeconds();
        if (ttlSeconds <= 0) {
            ttlSeconds = 1;
        }
        return redisTemplate.opsForValue()
                .set(PREFIX + jti, "1", Duration.ofSeconds(ttlSeconds))
                .onErrorReturn(false);
    }
}
