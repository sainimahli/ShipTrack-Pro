package com.shiptrackpro.entity;

/**
 * Shipment lifecycle states tracked by the shipment timeline module.
 */
public enum ShipmentStatus {

    CREATED,
    PICKED_UP,
    IN_TRANSIT,
    OUT_FOR_DELIVERY,
    DELIVERED,
    FAILED_DELIVERY,
    CANCELLED
}