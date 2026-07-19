package com.shiptrackpro.controller;

import com.shiptrackpro.dto.ProfileResponse;
import com.shiptrackpro.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.shiptrackpro.dto.UpdateProfileRequest;
import org.springframework.http.ResponseEntity;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping
    public ProfileResponse getProfile(Authentication authentication) {

        return profileService.getProfile(authentication.getName());
    }
    @PutMapping
    public ResponseEntity<?> updateProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request) {

        profileService.updateProfile(authentication.getName(), request);

        return ResponseEntity.ok(
                Map.of("message", "Profile updated successfully.")
        );
    }
}