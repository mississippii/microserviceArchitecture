package org.example.votingservice.repository;

import org.example.votingservice.entity.VotingToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VotingTokenRepository extends JpaRepository<VotingToken, Long> {

    Optional<VotingToken> findByToken(String token);
    Optional<VotingToken> findByStudentId(String studentId);
    boolean existsByStudentIdAndIsUsed(String studentId, boolean isUsed);
}
