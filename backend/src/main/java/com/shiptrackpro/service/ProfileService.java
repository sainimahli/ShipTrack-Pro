package com.shiptrackpro.service;

import com.shiptrackpro.dto.ProfileResponse;
import com.shiptrackpro.dto.UpdateProfileRequest;

public interface ProfileService {

    ProfileResponse getProfile(String email);

    void updateProfile(String email, UpdateProfileRequest request);

}