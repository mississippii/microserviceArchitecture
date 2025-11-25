package backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "students")
public class Student {
    @Id
    @Column(name = "student_id", nullable = false)
    private String studentId;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "profile_pic", columnDefinition = "TEXT")
    private String profilePic;

    @Column(name = "batch_year", nullable = false)
    private int batchYear;

    @Column(name = "occupation")
    private String occupation;

    @Column(name = "organization_name")
    private String organizationName;

    @Column(name = "active_status", columnDefinition = "tinyint(1) default 0")
    private boolean activeStatus;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "Blood_group")
    private String bloodGroup;

    @Column(name = "address")
    private String address;

    @Column(name = "department", nullable = false)
    private String department;

    @Column(name = "sex")
    private String sex;

    @Column(name = "facebook")
    private String facebook;

    @Column(name = "instagram")
    private String instagram;

    @Column(name = "linkedin")
    private String linkedin;

    @Column(name = "youtube")
    private String youtube;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}
