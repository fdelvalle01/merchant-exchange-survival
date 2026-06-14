package com.francisco.stockbar.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.security.keycloak.resource-client-id:stockbar-api}")
    private String resourceClientId;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/**").hasAnyRole("VIEWER", "TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.GET, "/api/price-history", "/api/price-history/**").hasAnyRole("VIEWER", "TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.GET, "/api/market-events", "/api/market-events/**").hasAnyRole("VIEWER", "TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.GET, "/api/news", "/api/news/**").hasAnyRole("VIEWER", "TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.GET, "/api/company/me", "/api/portfolio").hasAnyRole("VIEWER", "TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.GET, "/api/game/state").hasAnyRole("TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.POST, "/api/game/end-day", "/api/game/restart").hasAnyRole("TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.GET, "/api/game/auctions/**", "/api/game/relics/**").hasAnyRole("VIEWER", "TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.POST, "/api/game/auctions/**", "/api/game/relics/**").hasAnyRole("TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.POST, "/api/orders").hasAnyRole("TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.GET, "/api/orders", "/api/orders/**").hasAnyRole("TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.POST, "/api/sales").hasAnyRole("TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.GET, "/api/sales", "/api/sales/**").hasAnyRole("TRADER", "ADMIN_BAR")
                        .requestMatchers(HttpMethod.POST, "/api/products", "/api/products/**").hasRole("ADMIN_BAR")
                        .requestMatchers(HttpMethod.POST, "/api/admin/**").hasRole("ADMIN_BAR")
                        .requestMatchers(HttpMethod.DELETE, "/api/admin/**").hasRole("ADMIN_BAR")
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt ->
                        jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())
                ));

        return http.build();
    }

    private Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setPrincipalClaimName("preferred_username");
        converter.setJwtGrantedAuthoritiesConverter(this::extractAuthorities);
        return converter;
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        Set<String> roles = new HashSet<>();
        roles.addAll(extractRealmRoles(jwt));
        roles.addAll(extractResourceRoles(jwt));

        return roles.stream()
                .filter(role -> role != null && !role.isBlank())
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }

    @SuppressWarnings("unchecked")
    private List<String> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) return List.of();

        Object roles = realmAccess.get("roles");
        if (roles instanceof Collection<?> collection) {
            return collection.stream().map(String::valueOf).toList();
        }

        return List.of();
    }

    @SuppressWarnings("unchecked")
    private List<String> extractResourceRoles(Jwt jwt) {
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess == null) return List.of();

        Set<String> roles = new HashSet<>();
        Object configuredClientAccess = resourceAccess.get(resourceClientId);
        roles.addAll(extractRolesFromClientAccess(configuredClientAccess));

        resourceAccess.values().forEach(clientAccess -> roles.addAll(extractRolesFromClientAccess(clientAccess)));
        return roles.stream().toList();
    }

    @SuppressWarnings("unchecked")
    private List<String> extractRolesFromClientAccess(Object clientAccess) {
        if (!(clientAccess instanceof Map<?, ?> clientAccessMap)) return List.of();

        Object roles = clientAccessMap.get("roles");
        if (roles instanceof Collection<?> collection) {
            return collection.stream().map(String::valueOf).toList();
        }

        return List.of();
    }
}
