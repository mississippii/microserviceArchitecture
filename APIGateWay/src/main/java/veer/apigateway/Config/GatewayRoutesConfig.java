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
                // SECURITY service
                .route("SECURITY", r -> r
                        .path("/SECURITY/**")  // Uppercase path
                        .filters(f -> f
                                .stripPrefix(1)
                                .requestRateLimiter(config -> config
                                        .setKeyResolver(keyResolver)
                                        .setRateLimiter(redisRateLimiter)
                                        .setStatusCode(HttpStatus.TOO_MANY_REQUESTS)))
                        .uri("lb://SECURITY")) // Service name must match discovery
                // BACKEND service
                .route("BACKEND", r -> r
                        .path("/BACKEND/**")  // Uppercase path
                        .filters(f -> f
                                .stripPrefix(1)
                                .requestRateLimiter(config -> config
                                        .setKeyResolver(keyResolver)
                                        .setRateLimiter(redisRateLimiter)
                                        .setStatusCode(HttpStatus.TOO_MANY_REQUESTS)))
                        .uri("lb://BACKEND"))

                // VOTING-SERVICE
                .route("VOTING-SERVICE", r -> r
                        .path("/VOTING-SERVICE/**")  // Uppercase path
                        .filters(f -> f.stripPrefix(1))
                        .uri("lb://VOTING-SERVICE"))
                .build();
    }
}
