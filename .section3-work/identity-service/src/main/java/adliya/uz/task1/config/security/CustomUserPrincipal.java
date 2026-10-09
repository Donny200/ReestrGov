package adliya.uz.task1.config.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public final class CustomUserPrincipal implements UserDetails {

    private final Long userId;
    private final String username;
    private final String password;
    private final List<GrantedAuthority> authorities;
    private final boolean enabled;
    private final boolean mustChangePassword;
    private final long tokenVersion;

    public CustomUserPrincipal(
            Long userId,
            String username,
            String password,
            Collection<? extends GrantedAuthority> authorities,
            boolean enabled,
            boolean mustChangePassword,
            long tokenVersion
    ) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.authorities = List.copyOf(authorities);
        this.enabled = enabled;
        this.mustChangePassword = mustChangePassword;
        this.tokenVersion = tokenVersion;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
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
        return enabled;
    }

    public boolean mustChangePassword() {
        return mustChangePassword;
    }

    public Long userId() {
        return userId;
    }

    public long tokenVersion() {
        return tokenVersion;
    }
}
