package com.shiptrackpro.dto;

import java.time.LocalDateTime;

public class DriverLocationResponse {

    private Long driverId;
    private String locationName;
    private Double latitude;
    private Double longitude;
    private LocalDateTime timestamp;

    public DriverLocationResponse() {
    }

    public DriverLocationResponse(Long driverId, String locationName,
                                  Double latitude, Double longitude,
                                  LocalDateTime timestamp) {
        this.driverId = driverId;
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.timestamp = timestamp;
    }
    public DriverLocationResponse(Long driverId,
                                  Double latitude,
                                  Double longitude,
                                  LocalDateTime timestamp) {
        this.driverId = driverId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.timestamp = timestamp;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}