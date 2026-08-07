package com.shiptrackpro.controller;

import com.shiptrackpro.dto.PerformanceReportDto;
import com.shiptrackpro.dto.ShipmentReportDto;
import com.shiptrackpro.service.ReportService;
import com.shiptrackpro.util.CsvReportGenerator;
import com.shiptrackpro.util.PdfReportGenerator;
import com.shiptrackpro.util.PerformanceCsvGenerator;
import com.shiptrackpro.util.PerformancePdfGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    private final CsvReportGenerator csvReportGenerator;
    private final PdfReportGenerator pdfReportGenerator;

    private final PerformanceCsvGenerator performanceCsvGenerator;
    private final PerformancePdfGenerator performancePdfGenerator;

    // --------------------------------------------------------
    // Single Shipment Report
    // --------------------------------------------------------

    @GetMapping("/shipment/{trackingNumber}/{format}")
    public ResponseEntity<byte[]> downloadShipmentReport(
            @PathVariable String trackingNumber,
            @PathVariable String format) {

        ShipmentReportDto report =
                reportService.generateShipmentReport(trackingNumber);

        byte[] file;
        String filename;
        MediaType mediaType;

        if ("csv".equalsIgnoreCase(format)) {

            file = csvReportGenerator.generateSingleReport(report);
            filename = "shipment-" + trackingNumber + "-report.csv";
            mediaType = MediaType.parseMediaType("text/csv");

        } else if ("pdf".equalsIgnoreCase(format)) {

            file = pdfReportGenerator.generateSingleReport(
                    report,
                    "Shipment Report"
            );

            filename = "shipment-" + trackingNumber + "-report.pdf";
            mediaType = MediaType.APPLICATION_PDF;

        } else {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid report format"
            );
        }

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(filename)
                                .build()
                                .toString()
                )
                .contentType(mediaType)
                .body(file);
    }

    // --------------------------------------------------------
    // Weekly / Monthly / Delivery Performance Reports
    // --------------------------------------------------------

    @GetMapping("/{type}/{format}")
    public ResponseEntity<byte[]> downloadReport(
            @PathVariable String type,
            @PathVariable String format) {

        // ---------------- DELIVERY PERFORMANCE ----------------

        if ("performance".equalsIgnoreCase(type)) {

            PerformanceReportDto report =
                    reportService.generateDeliveryPerformanceReport();

            byte[] file;
            String filename;
            MediaType mediaType;

            if ("csv".equalsIgnoreCase(format)) {

                file = performanceCsvGenerator.generate(report);
                filename = "delivery-performance-report.csv";
                mediaType = MediaType.parseMediaType("text/csv");

            } else if ("pdf".equalsIgnoreCase(format)) {

                file = performancePdfGenerator.generate(report);
                filename = "delivery-performance-report.pdf";
                mediaType = MediaType.APPLICATION_PDF;

            } else {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid report format"
                );
            }

            return ResponseEntity.ok()
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            ContentDisposition.attachment()
                                    .filename(filename)
                                    .build()
                                    .toString()
                    )
                    .contentType(mediaType)
                    .body(file);
        }

        // ---------------- WEEKLY / MONTHLY ----------------

        List<ShipmentReportDto> reports;

        if ("weekly".equalsIgnoreCase(type)) {

            reports = reportService.generateWeeklyReport();

        } else if ("monthly".equalsIgnoreCase(type)) {

            reports = reportService.generateMonthlyReport();

        } else {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid report type"
            );
        }

        byte[] file;
        String filename;
        MediaType mediaType;

        if ("csv".equalsIgnoreCase(format)) {

            file = csvReportGenerator.generate(reports);
            filename = type + "-report.csv";
            mediaType = MediaType.parseMediaType("text/csv");

        } else if ("pdf".equalsIgnoreCase(format)) {

            file = pdfReportGenerator.generate(
                    reports,
                    type.substring(0, 1).toUpperCase()
                            + type.substring(1)
                            + " Shipment Report"
            );

            filename = type + "-report.pdf";
            mediaType = MediaType.APPLICATION_PDF;

        } else {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid report format"
            );
        }

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(filename)
                                .build()
                                .toString()
                )
                .contentType(mediaType)
                .body(file);
    }
}