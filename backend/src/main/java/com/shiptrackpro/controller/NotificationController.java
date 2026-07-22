package com.shiptrackpro.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Map;

import com.shiptrackpro.entity.User;
import com.shiptrackpro.dto.NotificationResponse;
import com.shiptrackpro.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(
                notificationService.getUserNotifications(user.getUserId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(
                Map.of(
                        "unreadCount",
                        notificationService.getUnreadNotificationCount(user.getUserId())
                )
        );
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long notificationId,
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(
                notificationService.markAsRead(
                        notificationId,
                        user.getUserId())
        );
    }

    @PutMapping("/read-all")
    public ResponseEntity<String> markAllAsRead(
            @AuthenticationPrincipal User user) {

        notificationService.markAllAsRead(user.getUserId());

        return ResponseEntity.ok("All notifications marked as read.");
    }
}