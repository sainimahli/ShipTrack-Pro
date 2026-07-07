package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.AuthResponse;
import com.shiptrackpro.dto.LoginRequest;
import com.shiptrackpro.dto.RegisterRequest;
import com.shiptrackpro.entity.BusinessClient;
import com.shiptrackpro.entity.RegistrationStatus;
import com.shiptrackpro.entity.Role;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.exception.EmailAlreadyExistsException;
import com.shiptrackpro.exception.InvalidCredentialsException;
import com.shiptrackpro.exception.PendingApprovalException;
import com.shiptrackpro.exception.RegistrationRejectedException;
import com.shiptrackpro.repository.BusinessClientRepository;
import com.shiptrackpro.repository.RoleRepository;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.security.JwtService;
import com.shiptrackpro.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BusinessClientRepository businessClientRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @Override
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists.");
        }

        if (request.getPhone() != null &&
                !request.getPhone().isBlank() &&
                userRepository.existsByPhone(request.getPhone())) {

            throw new EmailAlreadyExistsException("Phone number already exists.");
        }

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() ->
                        new RuntimeException("Invalid role selected."));

        User user = new User();

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());

        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        user.setRole(role);

        if ("CUSTOMER".equalsIgnoreCase(role.getRoleName())) {

            user.setRegistrationStatus(
                    RegistrationStatus.APPROVED
            );

        } else {

            user.setRegistrationStatus(
                    RegistrationStatus.PENDING
            );

        }

        user.setActive(true);

        User savedUser = userRepository.save(user);
        if ("BUSINESS_CLIENT".equalsIgnoreCase(role.getRoleName())) {

            if (request.getCompanyName() == null ||
                    request.getCompanyName().isBlank()) {

                throw new RuntimeException("Company name is required.");
            }

            BusinessClient businessClient = new BusinessClient();

            businessClient.setUser(savedUser);
            businessClient.setCompanyName(request.getCompanyName());
            businessClient.setGstNumber(request.getGstNumber());
            businessClient.setBusinessType(request.getBusinessType());
            businessClient.setWebsite(request.getWebsite());

            businessClientRepository.save(businessClient);
        }

        if (savedUser.getRegistrationStatus() == RegistrationStatus.APPROVED) {

            return new AuthResponse(
                    null,
                    savedUser.getRole().getRoleName(),
                    "Registration successful. You can login now."
            );

        }

        return new AuthResponse(
                null,
                savedUser.getRole().getRoleName(),
                "Registration request submitted successfully. Please wait for Admin approval."
        );
    }

    @Override
    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new InvalidCredentialsException("Invalid email or password.")
                );

        if (user.getRegistrationStatus() == RegistrationStatus.PENDING) {
            throw new PendingApprovalException(
                    "Your account is waiting for Admin approval."
            );
        }

        if (user.getRegistrationStatus() == RegistrationStatus.REJECTED) {
            throw new RegistrationRejectedException(
                    "Your registration request has been rejected."
            );
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        String token = jwtService.generateToken(user);

        return new AuthResponse(
                token,
                user.getRole().getRoleName(),
                "Login successful."
        );
    }
}