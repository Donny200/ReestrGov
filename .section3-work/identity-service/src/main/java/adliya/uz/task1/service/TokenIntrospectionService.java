package adliya.uz.task1.service;

import adliya.uz.task1.config.security.JwtService;
import adliya.uz.task1.dto.TokenIntrospectionResponse;
import adliya.uz.task1.entity.Organization;
import adliya.uz.task1.entity.Permission;
import adliya.uz.task1.entity.User;
import adliya.uz.task1.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TokenIntrospectionService {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public TokenIntrospectionResponse introspect(String token) {
        final Claims claims;
        try {
            claims = jwtService.extractAllClaims(token);
        } catch (JwtException | IllegalArgumentException exception) {
            return TokenIntrospectionResponse.inactive();
        }

        User user = userRepository.findById(jwtService.extractUserId(claims)).orElse(null);
        if (user == null
                || !Boolean.TRUE.equals(user.getEnabled())
                || user.getRole() == null
                || !Objects.equals(user.getEmail(), claims.getSubject())
                || user.getTokenVersion() != jwtService.extractTokenVersion(claims)) {
            return TokenIntrospectionResponse.inactive();
        }

        List<String> permissions = user.getRole().getPermissions().stream()
                .map(Permission::getCode)
                .filter(Objects::nonNull)
                .sorted()
                .toList();
        List<Long> activeOrganizationIds = user.getOrganizations().stream()
                .filter(organization -> Boolean.TRUE.equals(organization.getEnabled()))
                .map(Organization::getId)
                .filter(Objects::nonNull)
                .sorted()
                .toList();

        return new TokenIntrospectionResponse(
                true,
                user.getId(),
                user.getEmail(),
                user.getRole().getName(),
                permissions,
                activeOrganizationIds,
                user.getTokenVersion(),
                Boolean.TRUE.equals(user.getMustChangePassword()),
                claims.getId(),
                claims.getExpiration().toInstant()
        );
    }
}
