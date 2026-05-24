package com.francisco.stockbar.controller;

import com.francisco.stockbar.dto.MeResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private static final List<String> STOCKBAR_ROLES = List.of("ADMIN_BAR", "TRADER", "VIEWER");

    @GetMapping
    public MeResponse me(Authentication authentication) {
        String username = authentication.getName();

        if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
            Jwt jwt = jwtAuthentication.getToken();
            username = jwt.getClaimAsString("preferred_username");
            if (username == null || username.isBlank()) {
                username = jwt.getSubject();
            }
        }

        List<String> roles = authentication.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.replaceFirst("^ROLE_", ""))
                .filter(STOCKBAR_ROLES::contains)
                .distinct()
                .sorted((left, right) -> Integer.compare(STOCKBAR_ROLES.indexOf(left), STOCKBAR_ROLES.indexOf(right)))
                .toList();

        return MeResponse.builder()
                .username(username)
                .roles(roles)
                .build();
    }
}
