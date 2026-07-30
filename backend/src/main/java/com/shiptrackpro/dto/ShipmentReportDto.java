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
}