package security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.password.PasswordEncoder;
import security.entity.Role;
import security.entity.User;
import security.repository.RoleRepo;
import security.repository.UserRepo;

import java.util.Collections;

@SpringBootApplication
public class SecurityApplication {

    public static void main(String[] args) {
		SpringApplication.run(SecurityApplication.class, args);
	}
}
