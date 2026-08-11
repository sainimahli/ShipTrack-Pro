package com.shiptrackpro.controller;

import com.shiptrackpro.entity.User;
import com.shiptrackpro.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Secure endpoints for managing push notification device tokens.
 *
 * SECURITY: userId is always taken from the JWT (@AuthenticationPrincipal).
 * A user can only register/remove their own device tokens.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class PushNotificationController {

    private final PushNotificationService pushNotificationService;

    /**
     * POST /api/notifications/device-token
     * Body: { "deviceToken": "...", "platform": "android|ios|web" }
     */
    @PostMapping("/device-token")
    public ResponseEntity<Map<String, String>> registerToken(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> body) {

        String token    = body.get("deviceToken");
        String platform = body.getOrDefault("platform", "unknown");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "deviceToken is required."));
        }

        pushNotificationService.registerToken(currentUser.getUserId(), token, platform);
        return ResponseEntity.ok(Map.of("message", "Device token registered."));
    }

    /**
     * DELETE /api/notifications/device-token
     * Body: { "deviceToken": "..." }
     */
    @DeleteMapping("/device-token")
    public ResponseEntity<Map<String, String>> removeToken(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> body) {

        String token = body.get("deviceToken");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "deviceToken is required."));
        }

        pushNotificationService.removeToken(currentUser.getUserId(), token);
        return ResponseEntity.ok(Map.of("message", "Device token removed."));
    }
}
