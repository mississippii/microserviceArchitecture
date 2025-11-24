package veer.apigateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class RequestLoggingFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        long start = System.currentTimeMillis();
        return chain.filter(exchange)
                .then(Mono.fromRunnable(() -> {
                    HttpStatusCode statusCode = exchange.getResponse().getStatusCode();
                    long duration = System.currentTimeMillis() - start;
                    log.info("{} {} -> {} ({} ms)",
                            exchange.getRequest().getMethod(),
                            exchange.getRequest().getURI().getPath(),
                            statusCode != null ? statusCode.value() : "NA",
                            duration);
                }));
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
