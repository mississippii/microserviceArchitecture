package veer.apigateway.Config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;

@Configuration
public class GatewayRoutesConfig {

    private final KeyResolver keyResolver;
    private final RedisRateLimiter redisRateLimiter;

    public GatewayRoutesConfig(KeyResolver keyResolver, RedisRateLimiter redisRateLimiter) {
        this.keyResolver = keyResolver;
        this.redisRateLimiter = redisRateLimiter;
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("SECURITY", r -> r
                        .path("/security/**")
                        .filters(f -> f
                                .stripPrefix(1)
                                .requestRateLimiter(config -> config
                                        .setKeyResolver(keyResolver)
                                        .setRateLimiter(redisRateLimiter)
                                        .setStatusCode(HttpStatus.TOO_MANY_REQUESTS)))
                        .uri("lb://SECURITY"))
                .route("BACKEND", r -> r
                        .path("/backend/**")
                        .filters(f -> f
                                .stripPrefix(1)
                                .requestRateLimiter(config -> config
                                        .setKeyResolver(keyResolver)
                                        .setRateLimiter(redisRateLimiter)
                                        .setStatusCode(HttpStatus.TOO_MANY_REQUESTS)))
                        .uri("lb://BACKEND"))
                .route("BACKEND-UPPER", r -> r
                        .path("/BACKEND/**")
                        .filters(f -> f
                                .stripPrefix(1)
                                .requestRateLimiter(config -> config
                                        .setKeyResolver(keyResolver)
                                        .setRateLimiter(redisRateLimiter)
                                        .setStatusCode(HttpStatus.TOO_MANY_REQUESTS)))
                        .uri("lb://BACKEND"))
                .route("VOTING-SERVICE", r -> r
                        .path("/voting/**")
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://VOTING-SERVICE"))
                .build();
    }
}
