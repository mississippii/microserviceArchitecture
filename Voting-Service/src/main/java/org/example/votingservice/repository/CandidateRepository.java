package org.example.votingservice.repository;

import org.example.votingservice.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    List<Candidate> findByPosition(String position);
    boolean existsByNameAndPosition(String name, String position);
}
