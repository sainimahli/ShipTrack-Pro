package com.shiptrackpro.service;

import com.shiptrackpro.dto.NotificationResponse;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.enums.NotificationChannel;
import com.shiptrackpro.enums.NotificationEventType;

import java.util.List;

public interface NotificationService {

    void createNotification(
            User user,
            Shipment shipment,
            NotificationEventType eventType,
            NotificationChannel notificationChannel,
            String title,
            String message
    );

    List<NotificationResponse> getUserNotifications(Long userId);

    long getUnreadNotificationCount(Long userId);

    NotificationResponse markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);
}