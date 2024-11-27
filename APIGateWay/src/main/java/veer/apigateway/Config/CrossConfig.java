package veer.apigateway.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CrossConfig {

    @Bean
    public CorsWebFilter corFilter(){
        CorsConfiguration config = new CorsConfiguration();
        List<String> allowedOrigins = List.of(
                "http://localhost:3000"
        );
        config.setAllowedOrigins(allowedOrigins);
        List<String> allowedMethods = Arrays.asList("GET", "POST", "PUT", "DELETE");
        config.setAllowedMethods(allowedMethods);
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }
}
