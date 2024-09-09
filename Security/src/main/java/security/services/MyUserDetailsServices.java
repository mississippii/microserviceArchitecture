package security.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import security.dto.MyUserDetails;
import security.entity.User;
import security.repository.UserRepo;

@Service
public class MyUserDetailsServices implements UserDetailsService {
    private final UserRepo userRepo;

    public MyUserDetailsServices(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepo.findByUsername(username);
        return MyUserDetails.create(user);
    }
}
