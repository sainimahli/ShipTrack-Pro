package com.shiptrackpro.dto;

import com.shiptrackpro.enums.ShipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

/**
 * Outbound payload representing a shipment, returned by the service and
 * controller layers instead of the {@code Shipment} entity directly. This
 * keeps the persistence model decoupled from the public API contract.
 */
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentResponse {

    private Long id;
    private String trackingNumber;
    private String senderName;
    private String senderPhone;
    private String receiverName;
    private String receiverPhone;
    private String packageType;
    private Double packageWeight;
    private String origin;
    private String destination;
    private String deliveryAddress;
    private ShipmentStatus shipmentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
