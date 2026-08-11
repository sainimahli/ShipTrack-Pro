package com.shiptrackpro.service;

/**
 * Push notification abstraction via Firebase Cloud Messaging (FCM).
 *
 * When {@code fcm.enabled=false} (the default) no external call is made.
 *
 * Required environment variables when FCM_ENABLED=true:
 *   FCM_ENABLED                    – true/false (default: false)
 *   FIREBASE_PROJECT_ID            – your Firebase project ID
 *   FIREBASE_SERVICE_ACCOUNT_JSON  – base64-encoded service account JSON
 *                                    (never commit this value)
 */
public interface PushNotificationService {

    /**
     * Register a device token for the given user.
     * Safe to call multiple times — duplicates are ignored.
     */
    void registerToken(Long userId, String deviceToken, String platform);

    /** Remove a specific device token for the given user. */
    void removeToken(Long userId, String deviceToken);

    /**
     * Send a push notification to all registered devices of a user.
     *
     * @param userId  recipient user id
     * @param title   notification title
     * @param body    notification body
     */
    void sendToUser(Long userId, String title, String body);
}
