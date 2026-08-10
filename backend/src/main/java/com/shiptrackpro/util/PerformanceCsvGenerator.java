package com.shiptrackpro.util;

import com.shiptrackpro.dto.PerformanceReportDto;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class PerformanceCsvGenerator {

    public byte[] generate(PerformanceReportDto report) {

        StringBuilder csv = new StringBuilder();

        csv.append("Metric,Value\n");

        csv.append("Total Deliveries,")
                .append(report.getTotalDeliveries()).append("\n");

        csv.append("On-Time Deliveries,")
                .append(report.getOnTimeDeliveries()).append("\n");

        csv.append("Delayed Deliveries,")
                .append(report.getDelayedDeliveries()).append("\n");

        csv.append("Average Delivery Time,\"")
                .append(report.getAverageDeliveryTime()).append("\"\n");

        csv.append("Delivery Success Rate,")
                .append(String.format("%.2f%%", report.getDeliverySuccessRate()))
                .append("\n");

        csv.append("Delivery Failure Rate,")
                .append(String.format("%.2f%%", report.getDeliveryFailureRate()))
                .append("\n");

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }
}