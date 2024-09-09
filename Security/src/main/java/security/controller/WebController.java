package security.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WebController {
    @GetMapping("/hello")
    public String helloWorld() {
        return "Hello, Dark World!";
    }
}
