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
public class UpdateShipmentRequest {

    

    private Long senderAddressId;

    private Long receiverAddressId;

    private String senderCity;

    private String receiverCity;

    private String deliveryAddress;

    private Long originWarehouseId;

    private Long destinationWarehouseId;

    private Long assignedDriverId;

    private Long assignedVehicleId;

    private BigDecimal totalWeightKg;

    private String shipmentType;

    private String packageType;

    @Future(message = "Expected delivery date must be in the future")
    private LocalDate expectedDeliveryDate;
    private LocalDate expectedDeliveryDate;

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
