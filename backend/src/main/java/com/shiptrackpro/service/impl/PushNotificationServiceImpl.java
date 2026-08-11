package com.shiptrackpro.service.impl;

import com.shiptrackpro.entity.DeviceToken;
import com.shiptrackpro.repository.DeviceTokenRepository;
import com.shiptrackpro.service.PushNotificationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Push notification service implementation (FCM via HTTP v1 API).
 *
 * When {@code fcm.enabled=false} (the default) all methods are no-ops
 * that log at INFO level. The application starts and functions normally
 * without any Firebase credentials.
 *
 * To enable:
 *   FCM_ENABLED=true
 *   FIREBASE_PROJECT_ID=your-project-id
 *   FIREBASE_SERVICE_ACCOUNT_JSON=<base64-encoded service account JSON>
 */
@Service
@RequiredArgsConstructor
public class PushNotificationServiceImpl implements PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationServiceImpl.class);

    private final DeviceTokenRepository deviceTokenRepository;

    @Value("${fcm.enabled:false}")
    private boolean fcmEnabled;

    @Value("${firebase.project-id:}")
    private String firebaseProjectId;

    // ---------------------------------------------------------------------------
    // Token management — always active (no FCM credentials needed to store tokens)
    // ---------------------------------------------------------------------------

    @Override
    @Transactional
    public void registerToken(Long userId, String deviceToken, String platform) {
        if (deviceToken == null || deviceToken.isBlank()) return;
        boolean exists = deviceTokenRepository
                .findByUserIdAndDeviceToken(userId, deviceToken).isPresent();
        if (!exists) {
            DeviceToken token = DeviceToken.builder()
                    .userId(userId)
                    .deviceToken(deviceToken)
                    .platform(platform)
                    .build();
            deviceTokenRepository.save(token);
            log.debug("Device token registered for user {}.", userId);
        }
    }

    @Override
    @Transactional
    public void removeToken(Long userId, String deviceToken) {
        deviceTokenRepository.deleteByUserIdAndDeviceToken(userId, deviceToken);
        log.debug("Device token removed for user {}.", userId);
    }

    // ---------------------------------------------------------------------------
    // Push dispatch
    // ---------------------------------------------------------------------------

    @Override
    public void sendToUser(Long userId, String title, String body) {
        if (!fcmEnabled) {
            log.info("[FCM DISABLED] Would push to user {}: {} — {}", userId, title, body);
            return;
        }

        List<DeviceToken> tokens = deviceTokenRepository.findByUserId(userId);
        if (tokens.isEmpty()) {
            log.debug("No device tokens for user {} — push skipped.", userId);
            return;
        }

        for (DeviceToken token : tokens) {
            sendFcmMessage(token.getDeviceToken(), title, body);
        }
    }

    /**
     * Send a single FCM message via the FCM HTTP v1 API.
     * Requires a valid OAuth2 access token obtained from the service account —
     * full implementation requires google-auth-library or Firebase Admin SDK.
     * This stub logs a warning and skips the call when credentials are absent.
     */
    private void sendFcmMessage(String deviceToken, String title, String body) {
        if (firebaseProjectId.isBlank()) {
            log.error("FCM send skipped — FIREBASE_PROJECT_ID not configured.");
            return;
        }
        // Full implementation: obtain OAuth2 token from service account JSON,
        // then POST to https://fcm.googleapis.com/v1/projects/{projectId}/messages:send
        // Add the Firebase Admin SDK (com.google.firebase:firebase-admin) to pom.xml for a
        // complete implementation. Kept as a documented stub to avoid an unneeded dependency.
        log.info("[FCM STUB] Would send push '{}' to token {}.", title, deviceToken.substring(0, Math.min(8, deviceToken.length())) + "...");
    }
}
