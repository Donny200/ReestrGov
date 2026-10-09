package adliya.uz.task1.service;

import adliya.uz.task1.repository.RefreshTokenRepository;
import adliya.uz.task1.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SessionRevocationService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void invalidateAllSessions(Long userId) {
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("A persisted user is required to invalidate sessions");
        }

        int updatedUsers = userRepository.incrementTokenVersion(userId);
        if (updatedUsers != 1) {
            throw new IllegalStateException("Could not increment token version for user ID: " + userId);
        }

        refreshTokenRepository.revokeAllByUserId(userId);
    }
}
