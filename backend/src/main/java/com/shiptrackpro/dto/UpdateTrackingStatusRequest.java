package com.shiptrackpro.dto;

import com.shiptrackpro.entity.ShipmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UpdateTrackingStatusRequest {

    @NotBlank
    private String trackingNumber;

    @NotNull
    private ShipmentStatus status;

    @NotBlank
    private String description;

    public UpdateTrackingStatusRequest() {
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public ShipmentStatus getStatus() {
        return status;
    }

    public void setStatus(ShipmentStatus status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}