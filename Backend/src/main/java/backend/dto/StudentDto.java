package backend.dto;

import backend.entity.Student;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class StudentDto {
    private String studentId;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String profilePic;
    private int batchYear;
    private String occupation;
    private String organizationName;
    private boolean activeStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String bloodGroup;
    private String address;
    private String department;
    private String sex;
    private String facebook;
    private String instagram;
    private String linkedin;
    private String youtube;

    public StudentDto(Student student){
        this.studentId = student.getStudentId();
        this.firstName = student.getFirstName();
        this.lastName = student.getLastName();
        this.email = student.getEmail();
        this.phoneNumber = student.getPhoneNumber();
        this.profilePic = student.getProfilePic();
        this.batchYear = student.getBatchYear();
        this.occupation = student.getOccupation();
        this.organizationName = student.getOrganizationName();
        this.bloodGroup = student.getBloodGroup();
        this.address = student.getAddress();
        this.department = student.getDepartment();
        this.sex = student.getSex();
        this.facebook = student.getFacebook();
        this.instagram = student.getInstagram();
        this.linkedin = student.getLinkedin();
        this.youtube = student.getYoutube();
    }
}
