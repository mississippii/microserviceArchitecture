package security.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;
import security.dto.UserDto;
import security.entity.User;
import security.service.UserService;

@RestController
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("auth/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        return ResponseEntity.ok(userService.register(user));
    }

    @PostMapping("auth/login")
    public ResponseEntity<String> login(@RequestBody User user) {
        try {
            return ResponseEntity.ok(userService.userVerify(user));
        } catch (BadCredentialsException e) {
            throw new RuntimeException("Invalid UserName or Password "+e);
        }
    }
    @PostMapping("auth/profile-activate")
    public ResponseEntity<String> registerStudent(@RequestBody UserDto student) {
        return ResponseEntity.ok(userService.profileActivation(student));
    }
    @PostMapping("/auth/verify")
    public ResponseEntity<String> verifyAccount(@RequestParam("token") String token) {
        return ResponseEntity.ok(userService.verifyAccount(token));
    }
}
