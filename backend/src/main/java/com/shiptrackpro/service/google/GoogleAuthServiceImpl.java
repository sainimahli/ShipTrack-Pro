// Added this package for oAuth2 google login module

package com.shiptrackpro.service.google;

import com.shiptrackpro.dto.AuthResponse;
import com.shiptrackpro.entity.RegistrationStatus;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.exception.InvalidCredentialsException;
import com.shiptrackpro.exception.PendingApprovalException;
import com.shiptrackpro.exception.RegistrationRejectedException;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GoogleAuthServiceImpl implements GoogleAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Override
    public AuthResponse googleLogin(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new InvalidCredentialsException(
                                "Account not found. Please register first."
                        ));

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

        String token = jwtService.generateToken(user);

        return new AuthResponse(
                token,
                user.getRole().getRoleName(),
                "Google login successful."
        );
    }
}