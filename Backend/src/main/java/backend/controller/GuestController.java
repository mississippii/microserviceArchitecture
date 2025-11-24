package backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/guest")
public class GuestController {

    @PostMapping("/string")
    public ResponseEntity<String> guestString() {
        return ResponseEntity.ok("Guest endpoint is reachable");
    }
}
