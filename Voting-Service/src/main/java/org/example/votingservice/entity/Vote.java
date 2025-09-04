package org.example.votingservice.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "votes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"studentId", "position"})
})
@Data
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(nullable = false)
    private String position;

    @Column(name = "candidate_id", nullable = false)
    private Long candidateId;

    @Column(name = "vote_time")
    private LocalDateTime voteTime = LocalDateTime.now();

}
