package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.ProfileResponse;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.shiptrackpro.dto.UpdateProfileRequest;

@Service
public class ProfileServiceImpl implements ProfileService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public ProfileResponse getProfile(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        return new ProfileResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getRoleName(),
                user.getRegistrationStatus().name()
        );
    }
    @Override
    public void updateProfile(String email, UpdateProfileRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());

        userRepository.save(user);
    }
}