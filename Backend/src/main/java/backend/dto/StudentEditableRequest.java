package backend.dto;

import lombok.Data;

@Data
public class StudentEditableRequest {
    private String studentId;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String profilePic;
    private Integer batchYear;
    private String occupation;
    private String organizationName;
    private String bloodGroup;
    private String address;
    private String department;
    private String facebook;
    private String instagram;
    private String linkedin;
    private String youtube;
}
