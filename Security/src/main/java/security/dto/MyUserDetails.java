package security.dto;

import jakarta.persistence.ManyToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import security.entity.Role;
import security.entity.User;
import security.repository.UserRepo;

import java.util.Collection;
import java.util.List;
import java.util.Set;


@Data
@AllArgsConstructor
public class MyUserDetails implements UserDetails {

    private Long id;
    private String username;
    private String password;
    private Collection<? extends GrantedAuthority> authorities;

    public static MyUserDetails create(User user) {
        try {
            List<SimpleGrantedAuthority> authorities = user.getRole().stream()
                   .map(role -> new SimpleGrantedAuthority(role.getName())).toList();
            return new MyUserDetails(user.getId(), user.getUsername(), user.getPassword(), authorities);
        }
        catch (Exception e) {
            throw new RuntimeException("Error creating UserDetails", e);
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}