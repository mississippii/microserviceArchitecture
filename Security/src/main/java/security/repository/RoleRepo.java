package security.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import security.entity.Role;

public interface RoleRepo extends JpaRepository<Role,Long> {
}
