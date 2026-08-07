package com.shiptrackpro.util;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.shiptrackpro.dto.ShipmentReportDto;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class PdfReportGenerator {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

    public byte[] generate(List<ShipmentReportDto> reports, String title) {

        try {

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            Document document = new Document(PageSize.A3.rotate());

            PdfWriter.getInstance(document, outputStream);

            document.open();

            Font titleFont = FontFactory.getFont(
                    FontFactory.HELVETICA_BOLD,
                    18
            );

            Paragraph heading = new Paragraph(title, titleFont);
            heading.setAlignment(Element.ALIGN_CENTER);
            heading.setSpacingAfter(20);

            document.add(heading);

            PdfPTable table = new PdfPTable(18);

            table.setWidthPercentage(100);

            table.setWidths(new float[]{
                    1.4f, // Shipment ID
                    2.0f, // Tracking
                    2.0f, // Customer
                    1.6f, // Driver
                    2.0f, // Status
                    2.0f, // ETA
                    2.0f, // Delivered
                    2.0f, // Delivery Time
                    2.0f, // Delay
                    1.4f, // POD
                    1.4f, // Verified
                    2.8f, // Sender
                    2.8f, // Receiver
                    2.0f, // Failed
                    2.0f, // Cancelled
                    2.0f, // Returned
                    2.0f, // Updated By
                    2.0f  // Created
            });

            addHeader(table, "Shipment ID");
            addHeader(table, "Tracking");
            addHeader(table, "Customer");
            addHeader(table, "Driver ID");
            addHeader(table, "Status");
            addHeader(table, "ETA");
            addHeader(table, "Delivered");
            addHeader(table, "Delivery Time");
            addHeader(table, "Delay");
            addHeader(table, "POD");
            addHeader(table, "Verified");
            addHeader(table, "Sender");
            addHeader(table, "Receiver");
            addHeader(table, "Failed");
            addHeader(table, "Cancelled");
            addHeader(table, "Returned");
            addHeader(table, "Updated By");
            addHeader(table, "Created");

            for (ShipmentReportDto report : reports) {

                addCell(table, String.valueOf(report.getShipmentId()));
                addCell(table, report.getTrackingNumber());
                addCell(table, report.getCustomerName());
                addCell(table, report.getAssignedDriverId() == null
                        ? ""
                        : String.valueOf(report.getAssignedDriverId()));
                addCell(table, String.valueOf(report.getCurrentStatus()));
                addCell(table, format(report.getEstimatedArrival()));
                addCell(table, format(report.getDeliveredAt()));
                addCell(table, report.getDeliveryTime());
                addCell(table, report.getDelay());
                addCell(table, yesNo(report.getProofOfDeliveryAvailable()));
                addCell(table, yesNo(report.getProofVerified()));
                addCell(table, report.getSenderAddress());
                addCell(table, report.getReceiverAddress());
                addCell(table, format(report.getFailedDeliveryAt()));
                addCell(table, format(report.getCancelledAt()));
                addCell(table, format(report.getReturnedAt()));
                addCell(table, report.getLastUpdatedBy());
                addCell(table, format(report.getShipmentCreatedAt()));
            }

            document.add(table);

            document.close();

            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }

    private void addHeader(PdfPTable table, String text) {

        PdfPCell cell = new PdfPCell(new Phrase(text));

        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        table.addCell(cell);
    }

    private void addCell(PdfPTable table, String value) {

        table.addCell(value == null ? "" : value);
    }

    private String format(OffsetDateTime time) {

        if (time == null) {
            return "";
        }

        return time.format(FORMATTER);
    }

    private String yesNo(Boolean value) {

        if (value == null) {
            return "";
        }

        return value ? "Yes" : "No";
    }
    public byte[] generateSingleReport(
            ShipmentReportDto report,
            String title) {

        return generate(List.of(report), title);
    }
}