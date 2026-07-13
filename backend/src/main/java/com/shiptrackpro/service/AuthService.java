package com.shiptrackpro.service;

import com.shiptrackpro.dto.*;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    // Google Sign-In
    AuthResponse googleLogin(String email);

    // Forgot Password
    void forgotPassword(ForgotPasswordRequest request);

    void verifyOtp(VerifyOtpRequest request);

    void resetPassword(ResetPasswordRequest request);
}
