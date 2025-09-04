package org.example.votingservice.service;

import org.example.votingservice.entity.Candidate;
import org.example.votingservice.repository.CandidateRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CandidateService {
    private final CandidateRepository candidateRepository;

    public CandidateService(CandidateRepository candidateRepository) {
        this.candidateRepository = candidateRepository;
    }

    public Candidate addCandidate(Candidate candidate) {
        return candidateRepository.save(candidate);
    }

    public ResponseEntity<List<Candidate>> getCandidates() {
        return ResponseEntity.ok(candidateRepository.findAll());
    }
}
