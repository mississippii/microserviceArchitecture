package org.example.votingservice.controller;

import org.example.votingservice.entity.Candidate;
import org.example.votingservice.service.CandidateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class CandidateController {

    private final CandidateService candidateService;

    public CandidateController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

    @PostMapping("/candidate/findAll")
    public ResponseEntity<List<Candidate>> getAllCandidates() {
        return candidateService.getCandidates();
    }

    @PostMapping("/candidate/add")
    public ResponseEntity<?> addCandidate(@RequestBody Candidate candidate) {
        if (candidate.getName() == null || candidate.getPosition() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Name and Position are required"));
        }
        Candidate savedCandidate = candidateService.addCandidate(candidate);
        return ResponseEntity.ok(savedCandidate);
    }
}
