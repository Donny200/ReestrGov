package adliya.uz.task1.service;

import adliya.uz.task1.config.security.JwtProperties;
import adliya.uz.task1.entity.RefreshToken;
import adliya.uz.task1.entity.User;
import adliya.uz.task1.exception.InvalidRefreshTokenException;
import adliya.uz.task1.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServicePasswordChangeTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private JwtProperties jwtProperties;
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties();
        jwtProperties.setRefreshExpiration(60_000L);
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, jwtProperties);
    }

    @Test
    void refreshTokenIsNotCreatedBeforeMandatoryPasswordChange() {
        User user = User.builder().mustChangePassword(true).build();

        assertThatThrownBy(() -> refreshTokenService.createRefreshToken(user))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .hasMessageContaining("Password change");

        verifyNoInteractions(refreshTokenRepository);
    }

    @Test
    void rotateRevokesAllSessionsAndRejectsFlaggedUserWithoutAccessToken() {
        User user = User.builder().id(5L).mustChangePassword(true).build();
        RefreshToken stored = RefreshToken.builder()
                .user(user)
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> refreshTokenService.rotate("raw-refresh-token"))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .hasMessageContaining("Password change");

        verify(refreshTokenRepository).revokeAllByUserId(5L);
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void ordinaryUserCanStillRotateRefreshToken() {
        User user = User.builder().id(5L).mustChangePassword(false).build();
        RefreshToken stored = RefreshToken.builder()
                .user(user)
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(stored));

        RefreshTokenService.RotationResult result = refreshTokenService.rotate("raw-refresh-token");

        assertThat(stored.isRevoked()).isTrue();
        assertThat(result.user()).isSameAs(user);
        assertThat(result.rawToken()).isNotBlank();
        verify(refreshTokenRepository).save(stored);
        verify(refreshTokenRepository).save(argThat(token -> token != stored
                && token.getUser() == user
                && !token.isRevoked()));
    }

    @Test
    void disabledUserCannotCreateOrRotateRefreshTokens() {
        User user = User.builder().id(8L).enabled(false).build();
        RefreshToken stored = RefreshToken.builder()
                .user(user)
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
        when(refreshTokenRepository.findByTokenHashForUpdate(anyString())).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> refreshTokenService.createRefreshToken(user))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .hasMessageContaining("Disabled");
        assertThatThrownBy(() -> refreshTokenService.rotate("raw-refresh-token"))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .hasMessageContaining("Disabled");

        verify(refreshTokenRepository).revokeAllByUserId(8L);
    }

    @Test
    void invalidationFailuresAreConfiguredToCommitRevocation() throws Exception {
        Transactional transactional = RefreshTokenService.class
                .getMethod("rotate", String.class)
                .getAnnotation(Transactional.class);

        assertThat(transactional).isNotNull();
        assertThat(Arrays.asList(transactional.noRollbackFor()))
                .contains(InvalidRefreshTokenException.class);
    }
}
