package com.shiptrackpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDashboardResponse {

    // Shipment Monitoring

    private long totalShipments;

    private long pendingShipments;

    private long successfulShipments;

    private long failedShipments;

    private long cancelledShipments;

    private long returnedShipments;

    // User Management

    private long customers;

    private long businessClients;

    private long logisticsOperators;

    private long supportAgents;

    private long administrators;

    // Delivery Analytics

    private double deliverySuccessRate;
}