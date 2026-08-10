package com.shiptrackpro.dto;

import com.shiptrackpro.enums.ShipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentReportDto {

    // Existing Fields

    private Long shipmentId;

    private String trackingNumber;

    private String customerName;

    private String senderAddress;

    private String receiverAddress;

    private ShipmentStatus currentStatus;

    private OffsetDateTime shipmentCreatedAt;

    private OffsetDateTime pickedUpAt;

    private OffsetDateTime inTransitAt;

    private OffsetDateTime outForDeliveryAt;

    private OffsetDateTime deliveredAt;

    private OffsetDateTime failedDeliveryAt;

    private OffsetDateTime cancelledAt;

    private OffsetDateTime returnedAt;

    private String lastUpdatedBy;

    // Delivery Performance Fields

    private Long assignedDriverId;

    private OffsetDateTime estimatedArrival;

    /**
     * Human readable.
     * Example:
     * 2 Days 4 Hours
     * 5 Hours 20 Minutes
     */
    private String deliveryTime;

    /**
     * Example:
     * On Time
     * Delayed by 1 Day 3 Hours
     */
    private String delay;

    private Boolean proofOfDeliveryAvailable;

    private Boolean proofVerified;
}