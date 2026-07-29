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

            PdfPTable table = new PdfPTable(14);

            table.setWidthPercentage(100);

            table.setWidths(new float[]{
                    2.2f,
                    2f,
                    3f,
                    3f,
                    2f,
                    2f,
                    2f,
                    2f,
                    2f,
                    2f,
                    2f,
                    2f,
                    2f,
                    2f
            });

            addHeader(table, "Tracking");
            addHeader(table, "Customer");
            addHeader(table, "Sender");
            addHeader(table, "Receiver");
            addHeader(table, "Status");
            addHeader(table, "Created");
            addHeader(table, "Picked Up");
            addHeader(table, "In Transit");
            addHeader(table, "Out For Delivery");
            addHeader(table, "Delivered");
            addHeader(table, "Failed");
            addHeader(table, "Cancelled");
            addHeader(table, "Returned");
            addHeader(table, "Updated By");

            for (ShipmentReportDto report : reports) {

                addCell(table, report.getTrackingNumber());
                addCell(table, report.getCustomerName());
                addCell(table, report.getSenderAddress());
                addCell(table, report.getReceiverAddress());
                addCell(table, String.valueOf(report.getCurrentStatus()));
                addCell(table, format(report.getShipmentCreatedAt()));
                addCell(table, format(report.getPickedUpAt()));
                addCell(table, format(report.getInTransitAt()));
                addCell(table, format(report.getOutForDeliveryAt()));
                addCell(table, format(report.getDeliveredAt()));
                addCell(table, format(report.getFailedDeliveryAt()));
                addCell(table, format(report.getCancelledAt()));
                addCell(table, format(report.getReturnedAt()));
                addCell(table, report.getLastUpdatedBy());
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
}