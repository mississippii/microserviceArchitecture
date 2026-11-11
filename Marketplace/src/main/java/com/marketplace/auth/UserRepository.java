package com.marketplace.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);

    java.util.List<User> findByRole(User.Role role);
}
