package com.shiptrackpro.service;

import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.enums.NotificationChannel;
import com.shiptrackpro.enums.NotificationEventType;

public interface NotificationService {

    void createNotification(
            User user,
            Shipment shipment,
            NotificationEventType eventType,
            NotificationChannel notificationChannel,
            String title,
            String message
    );
}