package com.shiptrackpro.dto;

import jakarta.validation.constraints.NotBlank;

public class AlertRequest {

    @NotBlank(message = "Message is required")
    private String message;

    @NotBlank(message = "Alert type is required")
    private String alertType;

    public AlertRequest() {
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

}
