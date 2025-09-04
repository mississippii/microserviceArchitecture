package org.example.votingservice.entity;


import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Entity
@Data
@Table(name = "candidates")
public class Candidate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 100)
    private String name;

    @NotBlank(message = "Position is required")
    private String position;

    private String department;

    private String slogan;

    private String photoUrl;    // candidate photo
    private String symbol;

    public Candidate() {}

    public Candidate(String name, String position, String department, String slogan, String photoUrl, String symbol) {
        this.name = name;
        this.position = position;
        this.department = department;
        this.slogan = slogan;
        this.photoUrl = photoUrl;
        this.symbol = symbol;
    }
}
