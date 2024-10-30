package backend.dto;

import lombok.Data;

@Data
public class UserDto {
    String name;
    String studentId;
    int batch;
    String department;
}
