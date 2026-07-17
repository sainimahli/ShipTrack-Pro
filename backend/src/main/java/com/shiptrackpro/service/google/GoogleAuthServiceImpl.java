// Added this package for oAuth2 google login module

package com.shiptrackpro.service.google;

import com.shiptrackpro.dto.AuthResponse;
import com.shiptrackpro.entity.RegistrationStatus;
import com.shiptrackpro.entity.Role;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.exception.InvalidCredentialsException;
import com.shiptrackpro.exception.PendingApprovalException;
import com.shiptrackpro.exception.RegistrationRejectedException;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.repository.RoleRepository;
import com.shiptrackpro.security.JwtService;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoogleAuthServiceImpl implements GoogleAuthService {

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private JwtService jwtService;

        @Autowired
        private RoleRepository roleRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @Override
        @Transactional
        public AuthResponse googleLogin(String email, String fullName) {

                User user = userRepository.findByEmail(email)
                                .orElseGet(() -> createGoogleUser(email, fullName));

                if (user.getRegistrationStatus() == RegistrationStatus.PENDING) {
                        throw new PendingApprovalException(
                                        "Your account is waiting for Admin approval.");
                }

                if (user.getRegistrationStatus() == RegistrationStatus.REJECTED) {
                        throw new RegistrationRejectedException(
                                        "Your registration request has been rejected.");
                }

                Map<String, Object> claims = new HashMap<>();

                claims.put("role", user.getRole().getRoleName());

                String token = jwtService.generateToken(claims, user);

                return new AuthResponse(
                                token,
                                user.getRole().getRoleName(),
                                "Google login successful.");
        }

        private User createGoogleUser(String email, String fullName) {
                Role customerRole = roleRepository.findByRoleName("CUSTOMER")
                                .orElseThrow(() -> new InvalidCredentialsException(
                                                "The default CUSTOMER role is not configured."));

                String[] nameParts = fullName == null || fullName.isBlank()
                                ? new String[] { "Google", "User" }
                                : fullName.trim().split("\\s+", 2);

                User user = new User();
                user.setFirstName(nameParts[0]);
                user.setLastName(nameParts.length > 1 ? nameParts[1] : "User");
                user.setEmail(email.toLowerCase());
                user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
                user.setRole(customerRole);
                user.setRegistrationStatus(RegistrationStatus.APPROVED);
                user.setActive(true);

                return userRepository.save(user);
        }
}
