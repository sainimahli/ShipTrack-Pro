package com.shiptrackpro.dto;

import com.shiptrackpro.enums.NotificationChannel;
import com.shiptrackpro.enums.NotificationEventType;
import com.shiptrackpro.enums.NotificationStatus;

import java.time.OffsetDateTime;

public class NotificationResponse {

    private Long notificationId;
    private Long shipmentId;
    private NotificationEventType eventType;
    private NotificationChannel notificationType;
    private String title;
    private String message;
    private Boolean isRead;
    private NotificationStatus sentStatus;
    private OffsetDateTime createdAt;

    public NotificationResponse() {
    }

    public Long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }

    public Long getShipmentId() {
        return shipmentId;
    }

    public void setShipmentId(Long shipmentId) {
        this.shipmentId = shipmentId;
    }

    public NotificationEventType getEventType() {
        return eventType;
    }

    public void setEventType(NotificationEventType eventType) {
        this.eventType = eventType;
    }

    public NotificationChannel getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(NotificationChannel notificationType) {
        this.notificationType = notificationType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean read) {
        isRead = read;
    }

    public NotificationStatus getSentStatus() {
        return sentStatus;
    }

    public void setSentStatus(NotificationStatus sentStatus) {
        this.sentStatus = sentStatus;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}