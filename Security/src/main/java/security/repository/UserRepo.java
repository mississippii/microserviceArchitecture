package security.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import security.entity.User;

@Repository
public interface UserRepo extends JpaRepository<User, Integer> {
    User findByUserName(String userName);
}
