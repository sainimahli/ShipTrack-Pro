package com.shiptrackpro.service;

import com.shiptrackpro.dto.AuthResponse;
import com.shiptrackpro.dto.LoginRequest;
import com.shiptrackpro.dto.RegisterRequest;

/**
 * REFERENCE ONLY — you said this interface already exists in your project.
 * This is the shape AuthServiceImpl below assumes. If your actual
 * AuthService declares different method names or parameter types, either:
 *   (a) rename the methods in AuthServiceImpl to match yours, or
 *   (b) replace your interface with this one if it's just a stub.
 * Do not add this file if it will conflict with your existing interface.
 */
public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

}