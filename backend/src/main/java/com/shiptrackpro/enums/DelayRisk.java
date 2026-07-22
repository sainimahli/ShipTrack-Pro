package com.shiptrackpro.enums;

/**
 * Coarse-grained delay risk classification, returned by
 * {@link com.shiptrackpro.service.DelayPredictionService}. Kept separate
 * from {@code ShipmentStatus} — this describes a *prediction*, not the
 * shipment's actual lifecycle state.
 */
public enum DelayRisk {
    LOW,
    MEDIUM,
    HIGH
}
