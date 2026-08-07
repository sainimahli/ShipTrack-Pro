package com.shiptrackpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceReportDto {

    private long totalDeliveries;

    private long onTimeDeliveries;

    private long delayedDeliveries;

    private String averageDeliveryTime;

    private double deliverySuccessRate;

    private double deliveryFailureRate;
}