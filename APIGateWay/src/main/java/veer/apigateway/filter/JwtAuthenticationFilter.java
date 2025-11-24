package veer.apigateway.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import veer.apigateway.service.TokenBlacklistService;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final List<String> OPEN_PATHS = List.of(
            "/SECURITY/api/auth/register",
            "/SECURITY/api/auth/login"
    );

    private static final String DEFAULT_SECRET = "635266556A576E5A7234753778214125442A472D4B6150645367566B59703273";

    private final SecretKey signingKey;
    private final TokenBlacklistService tokenBlacklistService;

    public JwtAuthenticationFilter(@Value("${security.jwt.secret:}") String secret,
                                   TokenBlacklistService tokenBlacklistService) {
        String effectiveSecret = (secret != null && !secret.isBlank()) ? secret : DEFAULT_SECRET;
        this.signingKey = resolveKey(effectiveSecret);
        this.tokenBlacklistService = tokenBlacklistService;
    }

    private SecretKey resolveKey(String secret) {
        try {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        } catch (IllegalArgumentException ex) {
            return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        }
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        // Bypass auth for auth endpoints, guest endpoints, actuator, and preflight
        if (isOpenPath(path) || isGuestPath(path) || path.startsWith("/actuator")
                || (exchange.getRequest().getMethod() != null && exchange.getRequest().getMethod().name().equalsIgnoreCase("OPTIONS"))) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return unauthorized(exchange, "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        try {
            var claims = Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String jti = claims.getId();
            return tokenBlacklistService.isBlacklisted(jti)
                    .flatMap(blacklisted -> blacklisted ? unauthorized(exchange, "Token revoked") : chain.filter(exchange));
        } catch (Exception ex) {
            log.debug("JWT validation failed for path {}: {}", path, ex.getMessage());
            return unauthorized(exchange, "Invalid or expired token");
        }
    }

    private boolean isOpenPath(String path) {
        return OPEN_PATHS.stream().anyMatch(path::startsWith);
    }

    private boolean isGuestPath(String path) {
        return path.contains("/api/guest/");
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().add(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
