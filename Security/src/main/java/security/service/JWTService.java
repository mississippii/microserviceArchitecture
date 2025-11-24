package security.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Service
    public class JWTService {

        private static final String DEFAULT_SECRET = "635266556A576E5A7234753778214125442A472D4B6150645367566B59703273";
        private static final long DEFAULT_EXPIRATION = 7_200_000L; // 2 hours

        private final SecretKey secretKey;
        private final long expirationMillis;

        public JWTService(@Value("${security.jwt.secret:}") String secret,
                          @Value("${security.jwt.expiration:0}") long expirationMillis) {
            String effectiveSecret = (secret != null && !secret.isBlank()) ? secret : DEFAULT_SECRET;
            long effectiveExpiry = expirationMillis > 0 ? expirationMillis : DEFAULT_EXPIRATION;
            this.secretKey = resolveKey(effectiveSecret);
            this.expirationMillis = effectiveExpiry;
        }

        private SecretKey resolveKey(String secret) {
            try {
                // try Base64 first
                return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
            } catch (IllegalArgumentException ex) {
                // fall back to raw bytes (e.g., hex/plain text)
                return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            }
        }

        public String generateToken(UserDetails userDetails) {
            String role = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .findFirst()
                    .orElse("ROLE_CUSTOMER");
            Map<String, Object> claims = Map.of("role", role);
            return buildToken(claims, userDetails.getUsername());
        }

    public Instant tokenExpiryInstant() {
        return Instant.now().plusMillis(expirationMillis);
    }

        public String extractUserName(String token) {
            return extractClaim(token, Claims::getSubject);
        }

        public String extractJti(String token) {
            return extractClaim(token, Claims::getId);
        }

    public boolean validateToken(String token, UserDetails userDetails) {
        String username = extractUserName(token);
        return username.equalsIgnoreCase(userDetails.getUsername()) && !isTokenExpired(token);
    }

        private String buildToken(Map<String, Object> claims, String subject) {
            Instant now = Instant.now();
            return Jwts.builder()
                    .setClaims(claims)
                    .setSubject(subject)
                    .setId(java.util.UUID.randomUUID().toString())
                    .setIssuedAt(Date.from(now))
                    .setExpiration(Date.from(now.plusMillis(expirationMillis)))
                    .signWith(secretKey, SignatureAlgorithm.HS256)
                    .compact();
        }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
}
