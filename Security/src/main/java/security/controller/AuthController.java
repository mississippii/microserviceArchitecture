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

    @GetMapping("/get-token")
    public CsrfToken getAuthentication(HttpServletRequest request) {
        return (CsrfToken) request.getAttribute("_csrf");
    }

    @PostMapping("/hola")
    public String postAuthentication(HttpServletRequest request) {
        return "Hello World \n"+request.getSession().getId();
    }
}
