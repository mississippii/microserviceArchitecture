package security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class EmailConfig {
    @Bean
    public JavaMailSender getJavaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        // Configure mail server properties
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);

        // Set the credentials
        mailSender.setUsername("u1604090@student.cuet.ac.bd"); // Replace with your email
        mailSender.setPassword("amyv tiau jvyh qfls"); // Use your Gmail App Password

        // Set additional mail properties
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.connectiontimeout", "5000");

        return mailSender;
    }
}
