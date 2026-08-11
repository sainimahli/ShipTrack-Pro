package com.shiptrackpro.controller;

import com.shiptrackpro.dto.AccountActivityResponse;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.service.AccountActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Account activity / audit log endpoint.
 *
 * SECURITY: The authenticated user's ID is taken exclusively from the JWT
 * via @AuthenticationPrincipal — the client cannot request another user's
 * activity by changing a URL parameter.
 */
@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountActivityController {

    private final AccountActivityService accountActivityService;

    /**
     * GET /api/account/activity
     * Returns the activity log for the currently authenticated user only.
     */
    @GetMapping("/activity")
    public ResponseEntity<List<AccountActivityResponse>> getMyActivity(
            @AuthenticationPrincipal User currentUser) {

        List<AccountActivityResponse> activity =
                accountActivityService.getActivityForUser(currentUser.getUserId());

        return ResponseEntity.ok(activity);
    }
}
