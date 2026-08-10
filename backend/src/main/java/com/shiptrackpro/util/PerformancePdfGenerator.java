package com.shiptrackpro.util;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.shiptrackpro.dto.PerformanceReportDto;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;

@Component
public class PerformancePdfGenerator {

    public byte[] generate(PerformanceReportDto report) {

        try {

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            Document document = new Document(PageSize.A4);

            PdfWriter.getInstance(document, outputStream);

            document.open();

            Font titleFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    18
            );

            Paragraph title =
                    new Paragraph("Delivery Performance Report", titleFont);

            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);

            document.add(title);

            PdfPTable table = new PdfPTable(2);

            table.setWidthPercentage(100);
            table.setWidths(new float[]{4f, 2f});

            addHeader(table, "Metric");
            addHeader(table, "Value");

            addRow(table, "Total Deliveries",
                    String.valueOf(report.getTotalDeliveries()));

            addRow(table, "On-Time Deliveries",
                    String.valueOf(report.getOnTimeDeliveries()));

            addRow(table, "Delayed Deliveries",
                    String.valueOf(report.getDelayedDeliveries()));

            addRow(table, "Average Delivery Time",
                    report.getAverageDeliveryTime());

            addRow(table, "Delivery Success Rate",
                    String.format("%.2f%%",
                            report.getDeliverySuccessRate()));

            addRow(table, "Delivery Failure Rate",
                    String.format("%.2f%%",
                            report.getDeliveryFailureRate()));

            document.add(table);

            document.close();

            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate performance PDF", e);
        }
    }

    private void addHeader(PdfPTable table, String text) {

        PdfPCell cell = new PdfPCell(new Phrase(text));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addRow(PdfPTable table, String metric, String value) {

        table.addCell(metric);
        table.addCell(value == null ? "" : value);
    }
}