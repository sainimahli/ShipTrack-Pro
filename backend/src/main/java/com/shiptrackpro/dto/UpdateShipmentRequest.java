package com.shiptrackpro.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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

    

    @NotNull(message = "Sender address ID is required")
    private Long senderAddressId;

    @NotNull(message = "Receiver address ID is required")
    private Long receiverAddressId;

    private String senderCity;

    private String receiverCity;

    private String deliveryAddress;

    private Long originWarehouseId;

    private Long destinationWarehouseId;

    private Long assignedDriverId;

    private Long assignedVehicleId;

    @NotNull(message = "Total weight is required")
    @Positive(message = "Total weight must be greater than zero")
    private BigDecimal totalWeightKg;

    @NotNull(message = "Shipment type is required")
    private String shipmentType;

    private String packageType;

    @Future(message = "Expected delivery date must be in the future")
    private LocalDate expectedDeliveryDate;
}
