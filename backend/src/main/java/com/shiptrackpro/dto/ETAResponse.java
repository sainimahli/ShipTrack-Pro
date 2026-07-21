package com.shiptrackpro.dto;

import com.shiptrackpro.enums.ShipmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ETAResponse {

    private String trackingNumber;

    private ShipmentStatus shipmentStatus;

    private String estimatedArrival;

    private String remainingTime;

    private String delayReason;
}