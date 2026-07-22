package com.shiptrackpro.dto;

import java.time.LocalDate;

public class ForecastResponse {

    private LocalDate estimatedDelivery;
    private int confidence;
    private String message;

    public ForecastResponse() {
    }

    public ForecastResponse(LocalDate estimatedDelivery,
                            int confidence,
                            String message) {
        this.estimatedDelivery = estimatedDelivery;
        this.confidence = confidence;
        this.message = message;
    }

    public LocalDate getEstimatedDelivery() {
        return estimatedDelivery;
    }

    public void setEstimatedDelivery(LocalDate estimatedDelivery) {
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