package com.shiptrackpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDashboardResponse {

    // Active Shipments
    private long activeShipments;

    // Shipment History
    private long totalShipments;

    // Delivery Status Overview
    private long deliveredShipments;

    private long pendingShipments;

    private long failedShipments;

    private long cancelledShipments;
}