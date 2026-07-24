package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.AuthResponse;
import com.shiptrackpro.dto.LoginRequest;
import com.shiptrackpro.dto.RegisterRequest;
import com.shiptrackpro.dto.ForgotPasswordRequest;
import com.shiptrackpro.dto.VerifyOtpRequest;
import com.shiptrackpro.dto.ResetPasswordRequest;
import com.shiptrackpro.entity.PasswordResetToken;
import com.shiptrackpro.repository.PasswordResetTokenRepository;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import com.shiptrackpro.entity.BusinessClient;
import com.shiptrackpro.entity.RegistrationStatus;
import com.shiptrackpro.entity.Role;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.exception.EmailAlreadyExistsException;
import com.shiptrackpro.exception.InvalidCredentialsException;
import com.shiptrackpro.exception.PendingApprovalException;
import com.shiptrackpro.exception.RegistrationRejectedException;
import com.shiptrackpro.exception.InvalidOtpException;
import com.shiptrackpro.exception.OtpExpiredException;
import com.shiptrackpro.repository.BusinessClientRepository;
import com.shiptrackpro.repository.RoleRepository;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.security.JwtService;
import com.shiptrackpro.service.AuthService;
import com.shiptrackpro.service.EmailService;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@SuppressWarnings("null")
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

        @Autowired
        private EmailService emailService;

        @Autowired
        private PasswordResetTokenRepository passwordResetTokenRepository;

        private final SecureRandom secureRandom = new SecureRandom();

        @Override
        @Transactional
        public AuthResponse register(RegisterRequest request) {

                String email = normalizeRequired(request.getEmail(), "Email is required.").toLowerCase();
                String phone = normalizeOptional(request.getPhone());
                String password = normalizeRequired(request.getPassword(), "Password is required.");

                if (request.getRoleId() == null) {
                        throw new RuntimeException("Please select a role.");
                }

                if (userRepository.existsByEmail(email)) {
                        throw new EmailAlreadyExistsException("Email already exists.");
                }

                if (phone != null && userRepository.existsByPhone(phone)) {

                        throw new EmailAlreadyExistsException("Phone number already exists.");
                }

                Role role = roleRepository.findById(request.getRoleId())
                                .orElseThrow(() -> new RuntimeException("Invalid role selected."));

                String roleName = role.getRoleName();

                if (roleName != null && roleName.replaceAll("[^A-Za-z]", "").equalsIgnoreCase("SUPERADMIN")) {
                        throw new RuntimeException("The Super Admin role is no longer available.");
                }

                if ("BUSINESS_CLIENT".equalsIgnoreCase(roleName) &&
                                normalizeOptional(request.getCompanyName()) == null) {

                        throw new RuntimeException("Company name is required.");
                }

                User user = new User();

                user.setFirstName(normalizeRequired(request.getFirstName(), "First name is required."));
                user.setLastName(normalizeRequired(request.getLastName(), "Last name is required."));
                user.setEmail(email);
                user.setPhone(phone);

                user.setPassword(
                                passwordEncoder.encode(password));

                user.setRole(role);

                if ("CUSTOMER".equalsIgnoreCase(roleName)) {

                        user.setRegistrationStatus(
                                        RegistrationStatus.APPROVED);

                } else {

                        user.setRegistrationStatus(
                                        RegistrationStatus.PENDING);

                }

                user.setActive(true);

                User savedUser = userRepository.save(user);
                if ("BUSINESS_CLIENT".equalsIgnoreCase(roleName)) {

                        BusinessClient businessClient = new BusinessClient();

                        businessClient.setUser(savedUser);
                        businessClient.setCompanyName(normalizeRequired(request.getCompanyName(), "Company name is required."));
                        businessClient.setGstNumber(normalizeOptional(request.getGstNumber()));
                        businessClient.setBusinessType(normalizeOptional(request.getBusinessType()));
                        businessClient.setWebsite(normalizeOptional(request.getWebsite()));

                        businessClientRepository.save(businessClient);
                }

                if (savedUser.getRegistrationStatus() == RegistrationStatus.APPROVED) {

                        return new AuthResponse(
                                        null,
                                        savedUser.getRole().getRoleName(),
                                        "Registration successful. You can login now.");

                }

                return new AuthResponse(
                                null,
                                savedUser.getRole().getRoleName(),
                                "Registration request submitted successfully. Please wait for Admin approval.");
        }

        private String normalizeRequired(String value, String message) {
                String normalized = normalizeOptional(value);

                if (normalized == null) {
                        throw new RuntimeException(message);
                }

                return normalized;
        }

        private String normalizeOptional(String value) {
                if (value == null || value.isBlank()) {
                        return null;
                }

                return value.trim();
        }

        @Override
        public AuthResponse login(LoginRequest request) {

                User user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password."));

                if (user.getRegistrationStatus() == RegistrationStatus.PENDING) {
                        throw new PendingApprovalException(
                                        "Your account is waiting for Admin approval.");
                }

                if (user.getRegistrationStatus() == RegistrationStatus.REJECTED) {
                        throw new RegistrationRejectedException(
                                        "Your registration request has been rejected.");
                }

                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));

                Map<String, Object> claims = new HashMap<>();

                claims.put("role", user.getRole().getRoleName());

                String token = jwtService.generateToken(claims, user);

                return new AuthResponse(
                                token,
                                user.getRole().getRoleName(),
                                "Login successful.");
        }

        // Google Sign-In for oAuth2 login

        @Override
        public AuthResponse googleLogin(String email) {

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new InvalidCredentialsException(
                                                "Account not found. Please register first."));

                if (user.getRegistrationStatus() == RegistrationStatus.PENDING) {
                        throw new PendingApprovalException(
                                        "Your account is waiting for Admin approval.");
                }

                if (user.getRegistrationStatus() == RegistrationStatus.REJECTED) {
                        throw new RegistrationRejectedException(
                                        "Your registration request has been rejected.");
                }

                String token = jwtService.generateToken(user);

                return new AuthResponse(
                                token,
                                user.getRole().getRoleName(),
                                "Google login successful.");
        }
        @Override
        public void forgotPassword(ForgotPasswordRequest request) {

                User user = userRepository.findByEmail(request.getEmail())
                        .orElseThrow(() ->
                                new RuntimeException("No account found with this email."));

                PasswordResetToken token = new PasswordResetToken();

                token.setUser(user);

                String otp = generateOtp();

                token.setOtp(otp);

                token.setExpiresAt(
                        OffsetDateTime.now().plusMinutes(10));

                token.setIsUsed(false);

                passwordResetTokenRepository.save(token);

                emailService.sendOtpEmail(user.getEmail(), otp);
        }
        @Override
        public void verifyOtp(VerifyOtpRequest request) {

                User user = userRepository.findByEmail(request.getEmail())
                        .orElseThrow(() ->
                                new RuntimeException("User not found."));

                PasswordResetToken token = passwordResetTokenRepository
                        .findTopByUserAndOtpAndIsUsedFalseOrderByCreatedAtDesc(
                                user,
                                request.getOtp())
                        .orElseThrow(() ->
                                new InvalidOtpException("Invalid OTP."));

                if (token.getExpiresAt().isBefore(OffsetDateTime.now())) {
                        throw new OtpExpiredException("OTP has expired.");
                }
        }

        @Override
        public void resetPassword(ResetPasswordRequest request) {

                User user = userRepository.findByEmail(request.getEmail())
                        .orElseThrow(() ->
                                new RuntimeException("User not found."));

                PasswordResetToken token = passwordResetTokenRepository
                        .findTopByUserAndOtpAndIsUsedFalseOrderByCreatedAtDesc(
                                user,
                                request.getOtp())
                        .orElseThrow(() ->
                                new InvalidOtpException("Invalid OTP."));

                if (token.getExpiresAt().isBefore(OffsetDateTime.now())) {
                        throw new OtpExpiredException("OTP has expired.");
                }

                user.setPassword(
                        passwordEncoder.encode(request.getNewPassword()));

                userRepository.save(user);

                token.setIsUsed(true);

                passwordResetTokenRepository.save(token);
        }
        private String generateOtp() {

                int otp = 100000 + secureRandom.nextInt(900000);

                return String.valueOf(otp);
        }
}
