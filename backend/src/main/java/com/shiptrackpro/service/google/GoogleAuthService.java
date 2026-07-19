// Added this package for oAuth2 google login module

package com.shiptrackpro.service.google;

import com.shiptrackpro.dto.AuthResponse;

public interface GoogleAuthService {

    AuthResponse googleLogin(String email, String fullName);

}
