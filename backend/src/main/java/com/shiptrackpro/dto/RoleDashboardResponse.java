package com.shiptrackpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleDashboardResponse {

    private long totalShipments;

    private long activeShipments;

    private long deliveredShipments;

    private long pendingShipments;

    private long failedShipments;

    private long cancelledShipments;

    private long delayedShipments;
}