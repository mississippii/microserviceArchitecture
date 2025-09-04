package org.example.votingservice.repository;

import org.example.votingservice.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VoteRepository  extends JpaRepository<Vote, Integer> {
    boolean existsByStudentIdAndPosition(String studentId, String position);
}
