package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.ShipmentReportDto;
import com.shiptrackpro.entity.Address;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.entity.TrackingEvent;
import com.shiptrackpro.entity.User;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final TrackingEventRepository trackingEventRepository;
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

        ShipmentReportDto report = ShipmentReportDto.builder()
                .trackingNumber(shipment.getTrackingNumber())
                .customerName(user == null ? null : user.getFullName())
                .senderAddress(formatAddress(sender))
                .receiverAddress(formatAddress(receiver))
                .currentStatus(shipment.getShipmentStatus())
                .shipmentCreatedAt(shipment.getCreatedAt())
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

        return report;
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