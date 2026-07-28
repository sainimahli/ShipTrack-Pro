package com.shiptrackpro.dto;

import com.shiptrackpro.enums.ShipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.math.BigDecimal;



@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentResponse {

    private Long shipmentId;

    private String trackingNumber;

    private Long userId;

    private Long senderAddressId;

    private Long receiverAddressId;

    private String senderCity;

    private String receiverCity;

    private String deliveryAddress;

    private Long originWarehouseId;

    private Long destinationWarehouseId;

    private Long assignedDriverId;

    private Long assignedVehicleId;

    private ShipmentStatus shipmentStatus;

    private BigDecimal totalWeightKg;

    private String shipmentType;

    private String packageType;

    private LocalDate expectedDeliveryDate;

    private OffsetDateTime actualDeliveryDate;
    private OffsetDateTime estimatedArrival;

    private BigDecimal distanceRemainingKm;

    private String forecastConfidence;

    private Boolean isDelayed;

    private String delayReason;

    private Double currentLatitude;
    private Double currentLongitude;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
