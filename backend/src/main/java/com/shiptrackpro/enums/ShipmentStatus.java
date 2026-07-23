package com.shiptrackpro.enums;

/**
 * Lifecycle states for a {@link com.shiptrackpro.entity.Shipment}.
 *
 * <p>{@code CREATED} is the default status assigned on creation
 * ({@code Shipment.onCreate()}); {@code CANCELLED} is the terminal status
 * used by the soft-delete flow in {@code ShipmentServiceImpl.deleteShipment}.
 * The remaining values model the normal delivery pipeline so the status
 * field is production-ready rather than a two-value placeholder.</p>
 */
public enum ShipmentStatus {

    /** Shipment record created; not yet handed to a carrier. */
    CREATED,

    /** Package has been collected from the sender. */
    PICKED_UP,

    /** Package is in transit between facilities. */
    IN_TRANSIT,

    /** Package is with the courier for final-mile delivery. */
    OUT_FOR_DELIVERY,

    /** Package has been delivered to the receiver. */
    DELIVERED,

    /** Delivery attempt failed; package may be retried or returned. */
    FAILED_DELIVERY,

    /** Shipment was cancelled; terminal state used by the soft-delete flow. */
    CANCELLED,

    /** Package could not be delivered and was sent back to the sender. */
    RETURNED

}
