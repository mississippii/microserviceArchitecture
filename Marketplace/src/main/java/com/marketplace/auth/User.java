package com.marketplace.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    public enum Role { CUSTOMER, SELLER, ADMIN, VERIFIER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String phone;
    private String email;
    private String name;
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private Role role;
}
