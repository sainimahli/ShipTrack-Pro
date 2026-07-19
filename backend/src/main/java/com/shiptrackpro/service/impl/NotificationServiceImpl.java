package com.shiptrackpro.service.impl;

import com.shiptrackpro.entity.Notification;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.enums.NotificationChannel;
import com.shiptrackpro.enums.NotificationEventType;
import com.shiptrackpro.enums.NotificationStatus;
import com.shiptrackpro.repository.NotificationRepository;
import com.shiptrackpro.service.NotificationService;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public void createNotification(
            User user,
            Shipment shipment,
            NotificationEventType eventType,
            NotificationChannel notificationChannel,
            String title,
            String message) {

        Notification notification = new Notification();

        notification.setUser(user);
        notification.setShipment(shipment);
        notification.setEventType(eventType);
        notification.setNotificationType(notificationChannel);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setIsRead(false);
        notification.setSentStatus(NotificationStatus.PENDING);

        notificationRepository.save(notification);
    }
}