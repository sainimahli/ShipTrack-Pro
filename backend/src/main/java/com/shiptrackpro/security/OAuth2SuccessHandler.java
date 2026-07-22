package com.shiptrackpro.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import com.shiptrackpro.dto.AuthResponse;
import com.shiptrackpro.service.google.GoogleAuthService;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private GoogleAuthService googleAuthService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess( 
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String name = oauthUser.getAttribute("name");
        String email = oauthUser.getAttribute("email");
        Boolean emailVerified = oauthUser.getAttribute("email_verified");

        try {
    if (email == null || email.isBlank() || !Boolean.TRUE.equals(emailVerified)) {
        throw new IllegalArgumentException("Google did not provide a verified email address.");
    }

    AuthResponse authResponse = googleAuthService.googleLogin(email, name);

    response.sendRedirect(
            frontendUrl + "/dashboard/success?token="
                    + URLEncoder.encode(authResponse.getToken(), StandardCharsets.UTF_8));

} catch (RuntimeException ex) {

    String error = URLEncoder.encode(
            ex.getMessage(),
            StandardCharsets.UTF_8);

    response.sendRedirect(
            frontendUrl + "/login?error=" + error);
}
    }
}
