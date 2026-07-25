package com.shiptrackpro.dto;

import java.time.LocalDateTime;

public class ForecastResponse {

    private LocalDateTime estimatedDelivery;
    private int confidence;
    private String message;

    public ForecastResponse() {
    }

    public ForecastResponse(LocalDateTime estimatedDelivery,
                            int confidence,
                            String message) {
        this.estimatedDelivery = estimatedDelivery;
        this.confidence = confidence;
        this.message = message;
    }

    public LocalDateTime getEstimatedDelivery() {
        return estimatedDelivery;
    }

    public void setEstimatedDelivery(LocalDateTime estimatedDelivery) {
        this.estimatedDelivery = estimatedDelivery;
    }

    public int getConfidence() {
        return confidence;
    }

    public void setConfidence(int confidence) {
        this.confidence = confidence;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}