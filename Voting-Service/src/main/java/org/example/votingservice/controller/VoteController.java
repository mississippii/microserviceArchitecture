package org.example.votingservice.controller;


import org.example.votingservice.service.VoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class VoteController {

    private final VoteService voteService;

    public VoteController(VoteService voteService) {
        this.voteService = voteService;
    }

    @PostMapping("/votes")
    public ResponseEntity<?> submitVote(@RequestBody Map<String, Object> request) {
        String studentId = (String) request.get("studentId");
        Map<String, Object> votes = (Map<String, Object>) request.get("votes");
        try {
            voteService.submitVotes(studentId, votes);
            return ResponseEntity.ok(Map.of("message", "Vote submitted successfully!"));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(400).body(Map.of("message", ex.getMessage()));
        }
    }
}
