package com.shiptrackpro.util;

import com.shiptrackpro.dto.ShipmentReportDto;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class CsvReportGenerator {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

    public byte[] generate(List<ShipmentReportDto> reports) {

        StringBuilder csv = new StringBuilder();

        csv.append(
                "Shipment ID,Tracking Number,Customer,Assigned Driver ID,"
                        + "Sender Address,Receiver Address,Current Status,ETA,"
                        + "Created,Picked Up,In Transit,Out For Delivery,"
                        + "Delivered,Delivery Time,Delay,"
                        + "Proof Of Delivery,Proof Verified,"
                        + "Failed Delivery,Cancelled,Returned,Last Updated By\n"
        );

        for (ShipmentReportDto report : reports) {

            csv.append(value(report.getShipmentId())).append(",");
            csv.append(value(report.getTrackingNumber())).append(",");
            csv.append(value(report.getCustomerName())).append(",");
            csv.append(value(report.getAssignedDriverId())).append(",");
            csv.append(value(report.getSenderAddress())).append(",");
            csv.append(value(report.getReceiverAddress())).append(",");
            csv.append(value(report.getCurrentStatus())).append(",");
            csv.append(value(report.getEstimatedArrival())).append(",");
            csv.append(value(report.getShipmentCreatedAt())).append(",");
            csv.append(value(report.getPickedUpAt())).append(",");
            csv.append(value(report.getInTransitAt())).append(",");
            csv.append(value(report.getOutForDeliveryAt())).append(",");
            csv.append(value(report.getDeliveredAt())).append(",");
            csv.append(value(report.getDeliveryTime())).append(",");
            csv.append(value(report.getDelay())).append(",");
            csv.append(value(report.getProofOfDeliveryAvailable())).append(",");
            csv.append(value(report.getProofVerified())).append(",");
            csv.append(value(report.getFailedDeliveryAt())).append(",");
            csv.append(value(report.getCancelledAt())).append(",");
            csv.append(value(report.getReturnedAt())).append(",");
            csv.append(value(report.getLastUpdatedBy())).append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String value(Object value) {

        if (value == null) {
            return "";
        }

        if (value instanceof OffsetDateTime dateTime) {
            return dateTime.format(FORMATTER);
        }

        return "\"" + value.toString().replace("\"", "\"\"") + "\"";
    }

    public byte[] generateSingleReport(ShipmentReportDto report) {

        return generate(List.of(report));
    }
}