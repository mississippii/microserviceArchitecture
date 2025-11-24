package security.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import security.dto.PurchaseRequest;
import security.dto.UserProfileResponse;
import security.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin("*")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users/me")
    public ResponseEntity<UserProfileResponse> me() {
        return ResponseEntity.ok(userService.currentUserProfile());
    }

    @PostMapping("/users/purchase")
    public ResponseEntity<String> purchase(@Valid @RequestBody PurchaseRequest request) {
        return ResponseEntity.ok(userService.purchaseProduct(request));
    }

    @GetMapping("/admin/users")
    public ResponseEntity<List<UserProfileResponse>> allUsers() {
        return ResponseEntity.ok(userService.findAllUsers());
    }
}
