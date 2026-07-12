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

        AuthResponse authResponse = googleAuthService.googleLogin(email);

        System.out.println("JWT Token: " + authResponse.getToken());
        System.out.println("Role: " + authResponse.getRole());

        System.out.println("===== BEFORE REDIRECT =====");

        response.sendRedirect("http://localhost:5173/dashboard/success?token=" + authResponse.getToken());

        System.out.println("===== AFTER REDIRECT =====");
    }
}
