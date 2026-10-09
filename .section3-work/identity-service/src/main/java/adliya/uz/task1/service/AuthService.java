package adliya.uz.task1.service;

import adliya.uz.task1.dto.LoginRequest;
import adliya.uz.task1.dto.ChangePasswordRequest;
import adliya.uz.task1.dto.UserResponse;
import adliya.uz.task1.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final SessionRevocationService sessionRevocationService;


    public User login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        return userService.getByEmail(request.getEmail());
    }

    public UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new InsufficientAuthenticationException("Authentication is required");
        }
        User user = userService.getByEmail(authentication.getName());
        return UserResponse.from(user);
    }

    @Transactional
    public User changePassword(ChangePasswordRequest request) {
        User user = userService.getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        Long userId = user.getId();
        userService.save(user);
        sessionRevocationService.invalidateAllSessions(userId);
        return userService.getById(userId);
    }

    @Transactional
    public void logoutAllDevices() {
        sessionRevocationService.invalidateAllSessions(userService.getCurrentUser().getId());
    }



}
