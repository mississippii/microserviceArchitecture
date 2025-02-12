package security.service;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import security.dto.UserDto;
import security.entity.User;
import security.repository.UserRepo;

@Service
public class UserService {

    private final UserRepo userRepo;
    private final AuthenticationManager authenticationManager;
    private final BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder(10);
    private final JWTService jwtService;
    private final EmailService emailService;

    public UserService(UserRepo userRepo, AuthenticationManager authenticationManager, JWTService jwtService, EmailService emailService) {
        this.userRepo = userRepo;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    public User register(User user) {
        user.setPassword(bCryptPasswordEncoder.encode(user.getPassword()));
        return userRepo.save(user);
    }

    public String userVerify(User user) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user.getUserName(), user.getPassword()));
        if (authentication.isAuthenticated()) {
            return jwtService.generateToken(user.getUserName());
        }
        return "Invalid User or Password";
    }

    public String profileActivation(UserDto student) {
        User user = userRepo.findByUserName(student.getUsername());
        if(user == null) {
            return "Invalid User";
        } else if (user.isActive()) {
            return "You are already activated";
        }
        user.setPassword(bCryptPasswordEncoder.encode(student.getPassword()));
        user.setEmail(student.getEmail());
        userRepo.save(user);
        String token = jwtService.generateToken(user.getUserName());
        emailService.sendVerificationEmail(student.getEmail(), token);

        return "Registration successful! Check your email for verification.";
    }

    public String verifyAccount(String token) {
        String username = jwtService.extractUserName(token);
        if (username == null) {
            return "Invalid or expired token.";
        }

        User user = userRepo.findByUserName(username);
        user.setActive(true);
        userRepo.save(user);

        return"Account activated successfully! You can now log in.";
    }
}
