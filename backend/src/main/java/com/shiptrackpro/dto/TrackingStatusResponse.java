package com.shiptrackpro.dto;

import com.shiptrackpro.enums.ShipmentStatus;

import java.time.OffsetDateTime;

public class TrackingStatusResponse {

    private String trackingNumber;
    private ShipmentStatus currentStatus;
    private TrackingLocationResponse latestLocation;
    private OffsetDateTime latestUpdateAt;

    public TrackingStatusResponse() {
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public ShipmentStatus getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(ShipmentStatus currentStatus) {
        this.currentStatus = currentStatus;
    }

    public TrackingLocationResponse getLatestLocation() {
        return latestLocation;
    }

    public void setLatestLocation(TrackingLocationResponse latestLocation) {
        this.latestLocation = latestLocation;
    }

    public OffsetDateTime getLatestUpdateAt() {
        return latestUpdateAt;
    }

    public void setLatestUpdateAt(OffsetDateTime latestUpdateAt) {
        this.latestUpdateAt = latestUpdateAt;
    }
}