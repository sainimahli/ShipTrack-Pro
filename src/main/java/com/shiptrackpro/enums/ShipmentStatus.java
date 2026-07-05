package com.shiptrackpro.enums;

/**
 * Represents the lifecycle status of a {@link com.shiptrackpro.entity.Shipment}
 * as it moves through the ShipTrack Pro delivery pipeline.
 */
public enum ShipmentStatus {

    /** Shipment record created but not yet picked up by a carrier. */
    CREATED,

    /** Package has been collected from the sender. */
    PICKED_UP,

    /** Package is actively moving through the logistics network. */
    IN_TRANSIT,

    /** Package is on the final leg of delivery to the receiver. */
    OUT_FOR_DELIVERY,

    /** Package was successfully delivered to the receiver. */
    DELIVERED,

    /** Delivery attempt failed (e.g. receiver unavailable, address issue). */
    FAILED_DELIVERY,

    /** Shipment was cancelled before completion. */
    CANCELLED
}


