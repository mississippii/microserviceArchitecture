package security.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import security.services.MyUserDetailsServices;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true) // for enabling @PreAuthorize, @PostAuthorize annotations
public class SecurityConfig {
    public final MyUserDetailsServices userDetailsServices;

    public SecurityConfig(MyUserDetailsServices userDetailsServices) {
        this.userDetailsServices = userDetailsServices;
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity httpSecurity) throws Exception {
        AuthenticationManagerBuilder builder = httpSecurity.getSharedObject(AuthenticationManagerBuilder.class);
        builder.userDetailsService(userDetailsServices)
                .passwordEncoder(passwordEncoder());
        return builder.build();
    }
}
