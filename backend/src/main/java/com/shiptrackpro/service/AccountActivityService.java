package com.shiptrackpro.service;

import com.shiptrackpro.dto.AccountActivityResponse;

import java.util.List;

public interface AccountActivityService {

    /**
     * Record an account/security event.
     *
     * @param userId      owner of the activity record
     * @param action      short action identifier, e.g. "LOGIN_SUCCESS"
     * @param description human-readable description
     * @param success     whether the action succeeded
     * @param ipAddress   client IP address (may be null)
     */
    void record(Long userId, String action, String description,
                boolean success, String ipAddress);

    /**
     * Retrieve the activity log for the authenticated user only.
     * This method must be called with the currently authenticated user's id —
     * the controller enforces that rule via @AuthenticationPrincipal.
     */
    List<AccountActivityResponse> getActivityForUser(Long userId);
}
