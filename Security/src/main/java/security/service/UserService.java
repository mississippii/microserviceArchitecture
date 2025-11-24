package security.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import security.dto.AuthenticationRequest;
import security.dto.AuthenticationResponse;
import security.dto.PurchaseRequest;
import security.dto.RegisterRequest;
import security.dto.UserProfileResponse;
import security.entity.Role;
import security.entity.User;
import security.repository.UserRepo;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepo userRepo;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    public UserService(UserRepo userRepo,
                       AuthenticationManager authenticationManager,
                       PasswordEncoder passwordEncoder,
                       JWTService jwtService,
                       TokenBlacklistService tokenBlacklistService) {
        this.userRepo = userRepo;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Transactional
    public UserProfileResponse register(RegisterRequest request) {
        if (userRepo.existsByUserNameIgnoreCase(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken");
        }
        if (userRepo.existsByEmailIgnoreCase(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        User user = new User();
        user.setUserName(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole() : Role.CUSTOMER);
        user.setActive(true);

        User saved = userRepo.save(user);
        return new UserProfileResponse(saved.getId(), saved.getUserName(), saved.getEmail(), saved.getRole().name());
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails principal = (UserDetails) authentication.getPrincipal();
        String token = jwtService.generateToken(principal);
        Role role = userRepo.findByUserNameIgnoreCase(principal.getUsername())
                .map(User::getRole)
                .orElse(Role.CUSTOMER);

        return new AuthenticationResponse(token, jwtService.tokenExpiryInstant(), role.name());
    }

    public UserProfileResponse currentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        String username = authentication.getName();
        User user = userRepo.findByUserNameIgnoreCase(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return new UserProfileResponse(user.getId(), user.getUserName(), user.getEmail(), user.getRole().name());
    }

    public String purchaseProduct(PurchaseRequest request) {
        UserProfileResponse profile = currentUserProfile();
        return String.format("User %s ordered %d unit(s) of product %s",
                profile.getUsername(), request.getQuantity(), request.getProductId());
    }

    public void logout(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return;
        }
        String token = authHeader.substring(7);
        String jti = jwtService.extractJti(token);
        Instant expiry = jwtService.extractExpiration(token).toInstant();
        tokenBlacklistService.blacklist(jti, expiry);
        SecurityContextHolder.clearContext();
    }

    public List<UserProfileResponse> findAllUsers() {
        return userRepo.findAll()
                .stream()
                .map(user -> new UserProfileResponse(user.getId(), user.getUserName(), user.getEmail(), user.getRole().name()))
                .collect(Collectors.toList());
    }
}
