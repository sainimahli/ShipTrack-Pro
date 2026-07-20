package com.shiptrackpro.dto;

import java.time.LocalDateTime;

public class AlertResponse {

    private Long id;
    private Long shipmentId;
    private String message;
    private String alertType;
    private boolean isRead;
    private LocalDateTime createdAt;

    public AlertResponse() {
    }

    public AlertResponse(Long id, Long shipmentId, String message, String alertType,
                          boolean isRead, LocalDateTime createdAt) {
        this.id = id;
        this.shipmentId = shipmentId;
        this.message = message;
        this.alertType = alertType;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getShipmentId() {
        return shipmentId;
    }

    public void setShipmentId(Long shipmentId) {
        this.shipmentId = shipmentId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

}
