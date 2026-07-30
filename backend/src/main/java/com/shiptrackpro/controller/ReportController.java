package com.shiptrackpro.controller;

import com.shiptrackpro.dto.ShipmentReportDto;
import com.shiptrackpro.service.ReportService;
import com.shiptrackpro.util.CsvReportGenerator;
import com.shiptrackpro.util.PdfReportGenerator;
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

    @GetMapping("/{type}/{format}")
    public ResponseEntity<byte[]> downloadReport(
            @PathVariable String type,
            @PathVariable String format) {

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
                    type.substring(0, 1).toUpperCase() + type.substring(1) + " Shipment Report"
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
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(filename)
                                .build()
                                .toString())
                .contentType(mediaType)
                .body(file);
    }
}