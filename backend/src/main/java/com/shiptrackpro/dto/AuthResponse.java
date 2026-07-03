package com.shiptrackpro.dto;

import com.shiptrackpro.enums.Role;

public class AuthResponse {

    private String token;
    private Role role;
    private String message;

    public AuthResponse() {
    }

    public AuthResponse(String token, Role role, String message) {
        this.token = token;
        this.role = role;
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}