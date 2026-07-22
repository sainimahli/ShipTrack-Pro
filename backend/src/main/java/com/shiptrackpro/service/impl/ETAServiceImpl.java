package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.ETAResponse;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.service.ETAService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class ETAServiceImpl implements ETAService {

    private final ShipmentRepository shipmentRepository;

    @Override
    public ETAResponse getETA(String trackingNumber) {

        Shipment shipment = shipmentRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Shipment not found with tracking number: " + trackingNumber));

        String formattedETA = null;

        if (shipment.getEstimatedArrival() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

            formattedETA = shipment.getEstimatedArrival()
                    .atZoneSameInstant(ZoneId.of("Asia/Kolkata"))
                    .format(formatter);
        }

        return ETAResponse.builder()
                .trackingNumber(shipment.getTrackingNumber())
                .shipmentStatus(shipment.getShipmentStatus())
                .estimatedArrival(formattedETA)
                .remainingTime(calculateRemainingTime(shipment))
                .delayReason(Boolean.TRUE.equals(shipment.getIsDelayed())
                        ? shipment.getDelayReason()
                        : null)
                .build();
    }

    private String calculateRemainingTime(Shipment shipment) {

        switch (shipment.getShipmentStatus()) {

            case DELIVERED:
                return "Delivered";

            case CANCELLED:
                return "Shipment Cancelled";

            case RETURNED:
                return "Shipment Returned";

            default:
                break;
        }

        if (shipment.getEstimatedArrival() == null) {
            return "ETA not available";
        }

        OffsetDateTime now = OffsetDateTime.now();

        if (shipment.getEstimatedArrival().isBefore(now)) {
            return "ETA Expired";
        }

        Duration duration = Duration.between(now, shipment.getEstimatedArrival());

        long days = duration.toDays();
        long hours = duration.toHours() % 24;
        long minutes = duration.toMinutes() % 60;

        return String.format("%d days %d hours %d minutes",
                days, hours, minutes);
    }

}