package com.shiptrackpro.service;

import com.shiptrackpro.dto.ProfileResponse;

public interface ProfileService {

    ProfileResponse getProfile(String email);

}