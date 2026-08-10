package com.shiptrackpro.service;

import com.shiptrackpro.dto.PerformanceReportDto;
import com.shiptrackpro.dto.ShipmentReportDto;

import java.util.List;

public interface ReportService {

    List<ShipmentReportDto> generateWeeklyReport();

    List<ShipmentReportDto> generateMonthlyReport();

    PerformanceReportDto generateDeliveryPerformanceReport();

    ShipmentReportDto generateShipmentReport(String trackingNumber);
}