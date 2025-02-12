package security.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(value = "*")
public class AuthController {

    @GetMapping("/")
    public String index() {
        return "Hello World";
    }

    @PostMapping("/session-id")
    public String getSessionId(HttpServletRequest request) {
        return request.getSession().getId();
    }

    @PostMapping("/hola")
    public String postAuthentication(HttpServletRequest request) {
        return "Hello World \n"+request.getSession().getId();
    }
}
