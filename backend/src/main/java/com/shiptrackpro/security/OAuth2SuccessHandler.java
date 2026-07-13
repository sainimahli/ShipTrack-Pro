package com.shiptrackpro.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
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

    @Override
    public void onAuthenticationSuccess( 
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String name = oauthUser.getAttribute("name");
        String email = oauthUser.getAttribute("email");
        System.out.println("Google User: " + name);
        System.out.println("Email: " + email);

        try {

    AuthResponse authResponse = googleAuthService.googleLogin(email);

    System.out.println("JWT Token: " + authResponse.getToken());
    System.out.println("Role: " + authResponse.getRole());

    response.sendRedirect(
            "http://localhost:5173/dashboard/success?token="
                    + authResponse.getToken());

} catch (RuntimeException ex) {

    String error = URLEncoder.encode(
            ex.getMessage(),
            StandardCharsets.UTF_8);

    response.sendRedirect(
            "http://localhost:5173/login?error=" + error);
}
    }
}
