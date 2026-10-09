package adliya.uz.task1.controller;

import adliya.uz.task1.config.security.CookieUtil;
import adliya.uz.task1.config.security.JwtService;
import adliya.uz.task1.config.security.SpaCsrfTokenRequestHandler;
import adliya.uz.task1.dto.CsrfTokenResponse;
import adliya.uz.task1.dto.LoginRequest;
import adliya.uz.task1.dto.UserResponse;
import adliya.uz.task1.entity.User;
import adliya.uz.task1.exception.InvalidRefreshTokenException;
import adliya.uz.task1.service.AuthService;
import adliya.uz.task1.service.RefreshTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RestController;
import adliya.uz.task1.dto.ChangePasswordRequest;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final CookieUtil cookieUtil;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = authService.login(request);
        return withAuthCookies(HttpStatus.OK, user);
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(
            @CookieValue(name = "${app.cookie.refresh-token-name}", required = false) String refreshToken) {

        if (refreshToken == null) {
            return clearAuthCookies(HttpStatus.UNAUTHORIZED);
        }

        try {
            RefreshTokenService.RotationResult result = refreshTokenService.rotate(refreshToken);

            ResponseCookie accessCookie = cookieUtil.createAccessCookie(jwtService.generateToken(result.user()));
            ResponseCookie refreshCookie = cookieUtil.createRefreshCookie(result.rawToken());

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .build();
        } catch (InvalidRefreshTokenException ex) {
            return clearAuthCookies(HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "${app.cookie.refresh-token-name}", required = false) String refreshToken) {

        if (refreshToken != null) {
            refreshTokenService.revoke(refreshToken);
        }

        return clearAuthCookies(HttpStatus.OK);
    }

    @PostMapping("/logout-all")
    public ResponseEntity<Void> logoutAllDevices() {
        authService.logoutAllDevices();
        return clearAuthCookies(HttpStatus.OK);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(authService.getCurrentUser());
    }

    @GetMapping("/csrf")
    public ResponseEntity<CsrfTokenResponse> csrf(
            @RequestAttribute(SpaCsrfTokenRequestHandler.RAW_CSRF_TOKEN_ATTRIBUTE) CsrfToken csrfToken
    ) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(new CsrfTokenResponse(csrfToken.getToken(), csrfToken.getHeaderName()));
    }

    private ResponseEntity<UserResponse> withAuthCookies(HttpStatus status, User user) {
        ResponseCookie accessCookie = cookieUtil.createAccessCookie(jwtService.generateToken(user));

        if (Boolean.TRUE.equals(user.getMustChangePassword())) {
            return ResponseEntity.status(status)
                    .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                    .header(HttpHeaders.SET_COOKIE, cookieUtil.createLogoutRefreshCookie().toString())
                    .body(UserResponse.from(user));
        }

        ResponseCookie refreshCookie = cookieUtil.createRefreshCookie(
                refreshTokenService.createRefreshToken(user)
        );

        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(UserResponse.from(user));
    }

    private ResponseEntity<Void> clearAuthCookies(HttpStatus status) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, cookieUtil.createLogoutAccessCookie().toString())
                .header(HttpHeaders.SET_COOKIE, cookieUtil.createLogoutRefreshCookie().toString())
                .build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        User user = authService.changePassword(request);
        ResponseCookie accessCookie = cookieUtil.createAccessCookie(jwtService.generateToken(user));
        ResponseCookie refreshCookie = cookieUtil.createRefreshCookie(
                refreshTokenService.createRefreshToken(user)
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body("Password changed successfully.");
    }
    

}
