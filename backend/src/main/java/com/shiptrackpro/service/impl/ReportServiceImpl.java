package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.ShipmentReportDto;
import com.shiptrackpro.entity.Address;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.entity.ProofOfDelivery;
import com.shiptrackpro.entity.TrackingEvent;
import com.shiptrackpro.entity.User;

import com.shiptrackpro.enums.ShipmentStatus;
import com.shiptrackpro.repository.ProofOfDeliveryRepository;

import java.time.Duration;
import com.shiptrackpro.repository.AddressRepository;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.repository.TrackingEventRepository;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.OffsetDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import com.shiptrackpro.dto.PerformanceReportDto;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final ProofOfDeliveryRepository proofOfDeliveryRepository;
    @Override
    public List<ShipmentReportDto> generateWeeklyReport() {

        OffsetDateTime now = OffsetDateTime.now();

        OffsetDateTime startOfWeek = now
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);

        OffsetDateTime endOfWeek = startOfWeek.plusDays(7);

        List<Shipment> shipments =
                shipmentRepository.findByCreatedAtBetween(startOfWeek, endOfWeek);

        return shipments.stream()
                .map(this::buildReport)
                .toList();
    }
    @Override
    public List<ShipmentReportDto> generateMonthlyReport() {

        OffsetDateTime now = OffsetDateTime.now();

        OffsetDateTime startOfMonth = now
                .withDayOfMonth(1)
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);

        OffsetDateTime endOfMonth = startOfMonth.plusMonths(1);

        List<Shipment> shipments =
                shipmentRepository.findByCreatedAtBetween(startOfMonth, endOfMonth);

        return shipments.stream()
                .map(this::buildReport)
                .toList();
    }

    @Override
    public PerformanceReportDto generateDeliveryPerformanceReport() {

        List<Shipment> shipments = shipmentRepository.findAll();

        long totalDeliveries = 0;
        long onTimeDeliveries = 0;
        long delayedDeliveries = 0;
        long failedDeliveries = 0;

        Duration totalDeliveryDuration = Duration.ZERO;

        for (Shipment shipment : shipments) {

            if (shipment.getShipmentStatus() == ShipmentStatus.DELIVERED) {

                totalDeliveries++;

                OffsetDateTime pickedUpAt = null;

                List<TrackingEvent> events =
                        trackingEventRepository.findByShipmentOrderByUpdatedAtAsc(shipment);

                for (TrackingEvent event : events) {

                    if (event.getStatus() == ShipmentStatus.PICKED_UP) {
                        pickedUpAt = event.getUpdatedAt();
                        break;
                    }
                }

                ProofOfDelivery pod =
                        proofOfDeliveryRepository.findByShipmentId(shipment.getShipmentId())
                                .orElse(null);

                OffsetDateTime deliveredAt =
                        pod != null && pod.getDeliveredAt() != null
                                ? pod.getDeliveredAt()
                                : shipment.getActualDeliveryDate();

                if (pickedUpAt != null && deliveredAt != null) {

                    totalDeliveryDuration =
                            totalDeliveryDuration.plus(
                                    Duration.between(pickedUpAt, deliveredAt)
                            );
                }

                if (shipment.getEstimatedArrival() != null && deliveredAt != null) {

                    if (deliveredAt.isAfter(shipment.getEstimatedArrival())) {
                        delayedDeliveries++;
                    } else {
                        onTimeDeliveries++;
                    }
                }

            } else if (shipment.getShipmentStatus() == ShipmentStatus.FAILED_DELIVERY) {

                failedDeliveries++;
            }
        }

        String averageDeliveryTime = "0 Minutes";

        if (totalDeliveries > 0) {

            averageDeliveryTime =
                    formatDuration(
                            totalDeliveryDuration.dividedBy(totalDeliveries)
                    );
        }

        double successRate = 0;
        double failureRate = 0;

        long completed = totalDeliveries + failedDeliveries;

        if (completed > 0) {

            successRate =
                    (double) totalDeliveries * 100 / completed;

            failureRate =
                    (double) failedDeliveries * 100 / completed;
        }

        return PerformanceReportDto.builder()
                .totalDeliveries(totalDeliveries)
                .onTimeDeliveries(onTimeDeliveries)
                .delayedDeliveries(delayedDeliveries)
                .averageDeliveryTime(averageDeliveryTime)
                .deliverySuccessRate(successRate)
                .deliveryFailureRate(failureRate)
                .build();
    }

    @Override
    public ShipmentReportDto generateShipmentReport(String trackingNumber) {

        Shipment shipment = shipmentRepository
                .findByTrackingNumber(trackingNumber)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Shipment not found with tracking number : "
                                        + trackingNumber
                        ));

        return buildReport(shipment);
    }

    private ShipmentReportDto buildReport(Shipment shipment) {

        User user = userRepository.findById(shipment.getUserId()).orElse(null);

        Address sender = shipment.getSenderAddressId() == null
                ? null
                : addressRepository.findById(shipment.getSenderAddressId()).orElse(null);

        Address receiver = shipment.getReceiverAddressId() == null
                ? null
                : addressRepository.findById(shipment.getReceiverAddressId()).orElse(null);

        List<TrackingEvent> events =
                trackingEventRepository.findByShipmentOrderByUpdatedAtAsc(shipment);
        ProofOfDelivery proofOfDelivery =
                proofOfDeliveryRepository.findByShipmentId(shipment.getShipmentId())
                        .orElse(null);

        ShipmentReportDto report = ShipmentReportDto.builder()
                .shipmentId(shipment.getShipmentId())
                .trackingNumber(shipment.getTrackingNumber())
                .customerName(user == null ? null : user.getFullName())
                .senderAddress(formatAddress(sender))
                .receiverAddress(formatAddress(receiver))
                .currentStatus(shipment.getShipmentStatus())
                .shipmentCreatedAt(shipment.getCreatedAt())
                .assignedDriverId(shipment.getAssignedDriverId())
                .estimatedArrival(shipment.getEstimatedArrival())
                .build();

        for (TrackingEvent event : events) {

            switch (event.getStatus()) {

                case PICKED_UP ->
                        report.setPickedUpAt(event.getUpdatedAt());

                case IN_TRANSIT ->
                        report.setInTransitAt(event.getUpdatedAt());

                case OUT_FOR_DELIVERY ->
                        report.setOutForDeliveryAt(event.getUpdatedAt());

                case DELIVERED ->
                        report.setDeliveredAt(event.getUpdatedAt());

                case FAILED_DELIVERY ->
                        report.setFailedDeliveryAt(event.getUpdatedAt());

                case CANCELLED ->
                        report.setCancelledAt(event.getUpdatedAt());

                case RETURNED ->
                        report.setReturnedAt(event.getUpdatedAt());

                default -> {
                }
            }


        }
        if (!events.isEmpty()) {
            report.setLastUpdatedBy(events.get(events.size() - 1).getUpdatedBy());
        }
        // Proof of Delivery Information

        report.setProofOfDeliveryAvailable(proofOfDelivery != null);

        if (proofOfDelivery != null) {

            report.setProofVerified(Boolean.TRUE.equals(proofOfDelivery.getIsVerified()));

            if (proofOfDelivery.getDeliveredAt() != null) {
                report.setDeliveredAt(proofOfDelivery.getDeliveredAt());
            }

        } else {

            report.setProofVerified(false);
        }
        if (report.getPickedUpAt() != null && report.getDeliveredAt() != null) {

            Duration duration =
                    Duration.between(
                            report.getPickedUpAt(),
                            report.getDeliveredAt()
                    );

            report.setDeliveryTime(formatDuration(duration));
        }
        if (shipment.getEstimatedArrival() != null && report.getDeliveredAt() != null) {

            if (report.getDeliveredAt().isAfter(shipment.getEstimatedArrival())) {

                Duration delay =
                        Duration.between(
                                shipment.getEstimatedArrival(),
                                report.getDeliveredAt()
                        );

                report.setDelay("Delayed by " + formatDuration(delay));

            } else {

                report.setDelay("On Time");
            }
        }

        return report;
    }

    private String formatDuration(Duration duration) {

        if (duration == null || duration.isNegative()) {
            return "0 Minutes";
        }

        long days = duration.toDays();
        long hours = duration.toHours() % 24;
        long minutes = duration.toMinutes() % 60;

        StringBuilder builder = new StringBuilder();

        if (days > 0) {
            builder.append(days).append(days == 1 ? " Day " : " Days ");
        }

        if (hours > 0) {
            builder.append(hours).append(hours == 1 ? " Hour " : " Hours ");
        }

        if (minutes > 0 || builder.length() == 0) {
            builder.append(minutes)
                    .append(minutes == 1 ? " Minute" : " Minutes");
        }

        return builder.toString().trim();
    }

    private String formatAddress(Address address) {

        if (address == null) {
            return null;
        }

        return String.format("%s, %s, %s, %s, %s",
                address.getAddressLine1() == null ? "" : address.getAddressLine1(),
                address.getCity() == null ? "" : address.getCity(),
                address.getState() == null ? "" : address.getState(),
                address.getPostalCode() == null ? "" : address.getPostalCode(),
                address.getCountry() == null ? "" : address.getCountry());
    }

}