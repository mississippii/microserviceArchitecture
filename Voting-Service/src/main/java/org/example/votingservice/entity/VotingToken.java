package org.example.votingservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "voting_tokens")
public class VotingToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true)
    private String studentId;

    @NotBlank
    @Column(unique = true)
    private String token;

    private LocalDateTime expiresAt;

    private boolean isUsed = false;

    public VotingToken() {}

    public VotingToken(String studentId, String token, LocalDateTime expiresAt) {
        this.studentId = studentId;
        this.token = token;
        this.expiresAt = expiresAt;
    }
}
