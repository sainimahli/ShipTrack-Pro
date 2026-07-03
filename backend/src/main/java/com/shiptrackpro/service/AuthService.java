package com.shiptrackpro.service;

import com.shiptrackpro.dto.AuthResponse;
import com.shiptrackpro.dto.LoginRequest;
import com.shiptrackpro.dto.RegisterRequest;

public interface AuthService {

    void register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

}