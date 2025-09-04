package org.example.votingservice.repository;

import org.example.votingservice.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findById(String id);
    boolean existsById(String id);
    Optional<Student> findByEmail(String email);
}
