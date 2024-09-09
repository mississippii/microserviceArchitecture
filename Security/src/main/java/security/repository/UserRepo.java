package security.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import security.entity.User;

public interface UserRepo extends JpaRepository<User,Long> {
    User findByUsername(String username);
}
