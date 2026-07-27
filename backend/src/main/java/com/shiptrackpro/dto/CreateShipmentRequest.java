package com.shiptrackpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateShipmentRequest {

    private Long senderAddressId;

    private Long receiverAddressId;

    private Long originWarehouseId;

    private Long destinationWarehouseId;

    private Long assignedDriverId;

    private Long assignedVehicleId;

    private BigDecimal totalWeightKg;

    private String shipmentType;

    private LocalDate expectedDeliveryDate;

    // Fields used by the shipment-management screen.  They let the API create
    // the required address records instead of exposing database ids to users.
    private String senderName;
    private String senderCity;
    private String receiverName;
    private String receiverCity;
    private String packageType;
    private String weight;
    private String deliveryAddress;
    private LocalDate eta;
    private String priority;
}
