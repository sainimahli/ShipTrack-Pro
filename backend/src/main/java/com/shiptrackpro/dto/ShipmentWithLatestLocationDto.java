package com.shiptrackpro.dto;

import com.shiptrackpro.entity.Shipment;

public class ShipmentWithLatestLocationDto {

    private final Shipment shipment;
    private final Double latitude;
    private final Double longitude;

    public ShipmentWithLatestLocationDto(Shipment shipment, Double latitude, Double longitude) {
        this.shipment = shipment;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Shipment getShipment() {
        return shipment;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }
}
