package org.example.votingservice.entity;


import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
@Entity
@Data
@Table(name = "students")
public class Student {

    @Id
    @NotBlank(message = "Student ID is required")
    @Size(min = 7, max = 7, message = "Student ID must be exactly 7 characters")
    private String id;

    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 100, message = "Name must be between 3 and 100 characters")
    private String name;

    @NotBlank(message = "Department is required")
    private String department;

    @NotBlank(message = "Department ID is required")
    @Pattern(regexp = "\\d{2}", message = "Department ID must be exactly 2 digits")
    private String departmentId; // e.g., 03, 04, 10

    @NotBlank(message = "Session is required")
    @Pattern(
            regexp = "^(\\d{4})-(\\d{4})$",
            message = "Session must be in format YYYY-YYYY (e.g., 2016-2017)"
    )
    private String session;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    private boolean isEligible = true;
    private boolean hasVoted = false;

    public Student(String id, String name, String department, String departmentId, String session, String email) {
        this.id = id;
        this.name = name;
        this.department = department;
        this.departmentId = departmentId;
        this.session = session;
        this.email = email;
    }

    public Student() {
    }
}
