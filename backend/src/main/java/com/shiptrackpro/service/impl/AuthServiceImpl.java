package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.*;
import com.shiptrackpro.entity.*;
import com.shiptrackpro.exception.*;
import com.shiptrackpro.repository.*;
import com.shiptrackpro.security.JwtService;
import com.shiptrackpro.service.AuthService;
import com.shiptrackpro.service.EmailService;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


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

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;


    private final SecureRandom secureRandom = new SecureRandom();



    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {


        String email = normalizeRequired(
                request.getEmail(),
                "Email is required."
        ).toLowerCase();


        String phone = normalizeOptional(request.getPhone());


        if(userRepository.existsByEmail(email)){
            throw new EmailAlreadyExistsException(
                    "Email already exists."
            );
        }


        if(phone != null && userRepository.existsByPhone(phone)){
            throw new EmailAlreadyExistsException(
                    "Phone number already exists."
            );
        }


        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() ->
                        new RuntimeException("Invalid role selected.")
                );


        String roleName = role.getRoleName();



        User user = new User();

        user.setFirstName(
                normalizeRequired(request.getFirstName(),
                        "First name required.")
        );

        user.setLastName(
                normalizeRequired(request.getLastName(),
                        "Last name required.")
        );

        user.setEmail(email);

        user.setPhone(phone);


        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );


        user.setRole(role);



        if("CUSTOMER".equalsIgnoreCase(roleName)){

            user.setRegistrationStatus(
                    RegistrationStatus.APPROVED
            );

        }
        else{

            user.setRegistrationStatus(
                    RegistrationStatus.PENDING
            );

        }


        user.setActive(true);


        User savedUser = userRepository.save(user);



        if("BUSINESS_CLIENT".equalsIgnoreCase(roleName)){


            BusinessClient client = new BusinessClient();

            client.setUser(savedUser);

            client.setCompanyName(
                    normalizeRequired(
                            request.getCompanyName(),
                            "Company name required."
                    )
            );

            client.setGstNumber(
                    normalizeOptional(request.getGstNumber())
            );

            client.setBusinessType(
                    normalizeOptional(request.getBusinessType())
            );

            client.setWebsite(
                    normalizeOptional(request.getWebsite())
            );


            businessClientRepository.save(client);

        }



        if(savedUser.getRegistrationStatus()
                == RegistrationStatus.APPROVED){


            return new AuthResponse(
                    null,
                    roleName,
                    "Registration successful. You can login now."
            );

        }


        return new AuthResponse(
                null,
                roleName,
                "Registration request submitted. Wait for Admin approval."
        );

    }





    @Override
    public AuthResponse login(LoginRequest request){


        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new InvalidCredentialsException(
                                "Invalid email or password."
                        )
                );


        if(user.getRegistrationStatus()
                == RegistrationStatus.PENDING){

            throw new PendingApprovalException(
                    "Your account is waiting for Admin approval."
            );
        }



        if(user.getRegistrationStatus()
                == RegistrationStatus.REJECTED){

            throw new RegistrationRejectedException(
                    "Your registration has been rejected."
            );
        }



        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );



        Map<String,Object> claims = new HashMap<>();

        claims.put(
                "role",
                user.getRole().getRoleName()
        );



        String token = jwtService.generateToken(
                claims,
                user
        );



        return new AuthResponse(
                token,
                user.getRole().getRoleName(),
                "Login successful.",
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail()
        );

    }





    @Override
    public AuthResponse googleLogin(String email){


        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new InvalidCredentialsException(
                                "Account not found."
                        )
                );



        String token = jwtService.generateToken(
                user
        );


        return new AuthResponse(
                token,
                user.getRole().getRoleName(),
                "Google login successful.",
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail()
        );

    }


    @Override
    public void forgotPassword(ForgotPasswordRequest request){


        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException(
                                "No account found."
                        )
                );



        String otp = generateOtp();

        PasswordResetToken resetToken =
                new PasswordResetToken();


        resetToken.setUser(user);

        resetToken.setOtp(otp);

        resetToken.setExpiresAt(
                OffsetDateTime.now()
                        .plusMinutes(10)
        );

        resetToken.setIsUsed(false);



        passwordResetTokenRepository.save(resetToken);



        emailService.sendOtpEmail(
                user.getEmail(),
                otp
        );

    }





    @Override
    public void verifyOtp(VerifyOtpRequest request){


        User user = userRepository.findByEmail(
                request.getEmail()
        )
        .orElseThrow(() ->
                new RuntimeException(
                        "User not found."
                )
        );



        PasswordResetToken token =
                passwordResetTokenRepository
                .findTopByUserAndOtpAndIsUsedFalseOrderByCreatedAtDesc(
                        user,
                        request.getOtp()
                )
                .orElseThrow(() ->
                        new InvalidOtpException(
                                "Invalid OTP."
                        )
                );



        if(token.getExpiresAt()
                .isBefore(OffsetDateTime.now())){

            throw new OtpExpiredException(
                    "OTP expired."
            );
        }

    }


    @Override
    public void resetPassword(ResetPasswordRequest request){


        User user = userRepository.findByEmail(
                request.getEmail()
        )
        .orElseThrow(() ->
                new RuntimeException(
                        "User not found."
                )
        );



        PasswordResetToken token =
                passwordResetTokenRepository
                .findTopByUserAndOtpAndIsUsedFalseOrderByCreatedAtDesc(
                        user,
                        request.getOtp()
                )
                .orElseThrow(() ->
                        new InvalidOtpException(
                                "Invalid OTP."
                        )
                );



        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );


        userRepository.save(user);


        token.setIsUsed(true);


        passwordResetTokenRepository.save(token);

    }





    private String generateOtp(){

        int otp =
                100000 + secureRandom.nextInt(900000);

        return String.valueOf(otp);
    }





    private String normalizeRequired(
            String value,
            String message
    ){

        String result = normalizeOptional(value);

        if(result == null){
            throw new RuntimeException(message);
        }

        return result;
    }



    private String normalizeOptional(String value){

        if(value == null || value.isBlank()){
            return null;
        }

        return value.trim();
    }


}

