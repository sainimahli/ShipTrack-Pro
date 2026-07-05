package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.AuthResponse;
import com.shiptrackpro.dto.LoginRequest;
import com.shiptrackpro.dto.RegisterRequest;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.enums.Role;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.security.JwtService;
import com.shiptrackpro.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Default implementation of {@link AuthService}.
 *
 * <p>ASSUMPTIONS made about existing classes (adjust if yours differ):</p>
 * <ul>
 *     <li>{@code User} implements {@code UserDetails}, uses {@code email}
 *         as the username, and exposes a no-args constructor / builder with
 *         fields: fullName, email, password, role.</li>
 *     <li>{@code UserRepository} has {@code findByEmail(String)} returning
 *         {@code Optional<User>} and {@code existsByEmail(String)}.</li>
 *     <li>{@code JwtService} has a {@code generateToken(UserDetails)}
 *         method returning a {@code String}.</li>
 *     <li>{@code JwtService} package is {@code com.shiptrackpro.security} —
 *         change the import if yours lives elsewhere.</li>
 * </ul>
 */
@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Constructor injection — preferred over field injection for
     * testability and immutability of dependencies.
     */
    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService,
                           AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        // Enforce email uniqueness before hitting the DB constraint, so we
        // can return a clean error instead of a raw SQL exception.
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException(
                    "An account with this email already exists: " + request.getEmail());
        }


        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.CUSTOMER);

        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser);

        return AuthResponse.builder()
                .token(token)
                .email(savedUser.getEmail())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        // Delegates to Spring Security's AuthenticationManager, which uses
        // CustomUserDetailsService + the configured PasswordEncoder under
        // the hood. Throws AuthenticationException (e.g. BadCredentialsException)
        // on failure, which should be mapped to a 401/403 by your global
        // exception handler.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .build();
    }

}
