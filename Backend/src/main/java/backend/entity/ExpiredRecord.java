package backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
public class ExpiredRecord {

    @Id
    private Long id;
    private String did_number;
    private LocalDateTime expireAt;
}
