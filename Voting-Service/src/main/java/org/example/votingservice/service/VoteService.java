package org.example.votingservice.service;

import jakarta.transaction.Transactional;
import org.example.votingservice.entity.Candidate;
import org.example.votingservice.entity.Vote;
import org.example.votingservice.repository.CandidateRepository;
import org.example.votingservice.repository.VoteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class VoteService {
    private final VoteRepository voteRepository;
    private final CandidateRepository candidateRepository;

    public VoteService(VoteRepository voteRepository, CandidateRepository candidateRepository) {
        this.voteRepository = voteRepository;
        this.candidateRepository = candidateRepository;
    }

    @Transactional
    public void submitVotes(String studentId, Map<String, Object> votesObj) {
        for (Map.Entry<String, Object> entry : votesObj.entrySet()) {
            String position = entry.getKey();

            // convert Object to Long safely
            Long candidateId;
            try {
                candidateId = Long.valueOf(entry.getValue().toString());
            } catch (NumberFormatException e) {
                throw new RuntimeException("Invalid candidate ID for position: " + position);
            }

            // check candidate exists
            Candidate candidate = candidateRepository.findById(candidateId)
                    .orElseThrow(() -> new RuntimeException("Candidate not found"));

            // check candidate belongs to position
            if (!candidate.getPosition().equals(position)) {
                throw new RuntimeException("Candidate does not belong to position " + position);
            }

            // check if student already voted
            if (voteRepository.existsByStudentIdAndPosition(studentId, position)) {
                throw new RuntimeException("You have already voted for " + position);
            }

            // save vote
            Vote vote = new Vote();
            vote.setStudentId(studentId);
            vote.setCandidateId(candidateId);
            vote.setPosition(position);
            vote.setVoteTime(LocalDateTime.now());
            voteRepository.save(vote);
        }
    }
}
