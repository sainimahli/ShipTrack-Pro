package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.NotificationResponse;
import com.shiptrackpro.entity.Notification;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.enums.NotificationChannel;
import com.shiptrackpro.enums.NotificationEventType;
import com.shiptrackpro.enums.NotificationStatus;
import com.shiptrackpro.exception.ResourceNotFoundException;
import com.shiptrackpro.repository.NotificationRepository;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            UserRepository userRepository) {

        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
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

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(Long userId) {

        User user = findUser(userId);

        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadNotificationCount(Long userId) {

        User user = findUser(userId);
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    @Override
    public NotificationResponse markAsRead(Long notificationId, Long userId) {

        User user = findUser(userId);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Notification not found with id: " + notificationId));

        if (!notification.getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException("Notification not found.");
        }

        notification.setIsRead(true);

        return mapToResponse(notificationRepository.save(notification));
    }

    @Override
    public void markAllAsRead(Long userId) {

        User user = findUser(userId);

        List<Notification> notifications =
                notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);

        notifications.forEach(notification -> notification.setIsRead(true));

        notificationRepository.saveAll(notifications);
    }

    private User findUser(Long userId) {

        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found with id: " + userId));
    }

    private NotificationResponse mapToResponse(Notification notification) {

        NotificationResponse response = new NotificationResponse();

        response.setNotificationId(notification.getNotificationId());

        if (notification.getShipment() != null) {
            response.setShipmentId(notification.getShipment().getShipmentId());
        }

        response.setEventType(notification.getEventType());
        response.setNotificationType(notification.getNotificationType());
        response.setTitle(notification.getTitle());
        response.setMessage(notification.getMessage());
        response.setIsRead(notification.getIsRead());
        response.setSentStatus(notification.getSentStatus());
        response.setCreatedAt(notification.getCreatedAt());

        return response;
    }
}