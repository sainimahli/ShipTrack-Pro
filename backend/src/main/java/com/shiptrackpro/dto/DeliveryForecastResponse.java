package com.shiptrackpro.dto;

import java.time.OffsetDateTime;

/**
 * ETA forecast calculated from the shipment's current lifecycle state and
 * most recent tracking update.
 */
public class DeliveryForecastResponse {

    private String trackingNumber;
    private OffsetDateTime predictedDeliveryAt;
    private long predictedDelayMinutes;
    private int confidencePercentage;
    private String riskLevel;
    private String reason;

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
    public OffsetDateTime getPredictedDeliveryAt() { return predictedDeliveryAt; }
    public void setPredictedDeliveryAt(OffsetDateTime predictedDeliveryAt) { this.predictedDeliveryAt = predictedDeliveryAt; }
    public long getPredictedDelayMinutes() { return predictedDelayMinutes; }
    public void setPredictedDelayMinutes(long predictedDelayMinutes) { this.predictedDelayMinutes = predictedDelayMinutes; }
    public int getConfidencePercentage() { return confidencePercentage; }
    public void setConfidencePercentage(int confidencePercentage) { this.confidencePercentage = confidencePercentage; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
