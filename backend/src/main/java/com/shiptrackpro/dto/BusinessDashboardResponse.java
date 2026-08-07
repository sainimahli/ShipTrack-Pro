package com.shiptrackpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessDashboardResponse {

    // Shipment Analytics
    private long totalShipments;

    // Logistics Overview
    private long activeShipments;

    private long completedShipments;

    // Delivery Performance
    private long failedShipments;

    // Delay Analysis
    private long delayedShipments;

    private double deliverySuccessRate;
}