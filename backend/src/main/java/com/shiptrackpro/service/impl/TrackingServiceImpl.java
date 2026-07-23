package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.TrackingLocationResponse;
import com.shiptrackpro.dto.DeliveryForecastResponse;
import com.shiptrackpro.dto.TrackingStatusResponse;
import com.shiptrackpro.dto.TrackingTimelineResponse;
import com.shiptrackpro.dto.UpdateLocationRequest;
import com.shiptrackpro.dto.UpdateTrackingStatusRequest;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.entity.TrackingEvent;
import com.shiptrackpro.enums.ShipmentStatus;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.repository.TrackingEventRepository;
import com.shiptrackpro.service.TrackingService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import java.time.OffsetDateTime;
import java.time.Duration;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.shiptrackpro.service.NotificationService;
import com.shiptrackpro.enums.NotificationChannel;
import com.shiptrackpro.enums.NotificationEventType;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.repository.UserRepository;

@Service
public class TrackingServiceImpl implements TrackingService {

    private static final String SYSTEM_USER = "SYSTEM";

    private static final Map<ShipmentStatus, Set<ShipmentStatus>> VALID_TRANSITIONS = new EnumMap<>(
            ShipmentStatus.class);

    static {

        VALID_TRANSITIONS.put(
                ShipmentStatus.CREATED,
                EnumSet.of(
                        ShipmentStatus.PICKED_UP,
                        ShipmentStatus.CANCELLED));

        VALID_TRANSITIONS.put(
                ShipmentStatus.PICKED_UP,
                EnumSet.of(
                        ShipmentStatus.IN_TRANSIT,
                        ShipmentStatus.CANCELLED));

        VALID_TRANSITIONS.put(
                ShipmentStatus.IN_TRANSIT,
                EnumSet.of(
                        ShipmentStatus.OUT_FOR_DELIVERY,
                        ShipmentStatus.CANCELLED));

        VALID_TRANSITIONS.put(
                ShipmentStatus.OUT_FOR_DELIVERY,
                EnumSet.of(
                        ShipmentStatus.DELIVERED,
                        ShipmentStatus.FAILED_DELIVERY,
                        ShipmentStatus.CANCELLED));

        VALID_TRANSITIONS.put(
                ShipmentStatus.FAILED_DELIVERY,
                EnumSet.of(
                        ShipmentStatus.OUT_FOR_DELIVERY,
                        ShipmentStatus.RETURNED,
                        ShipmentStatus.CANCELLED));

        VALID_TRANSITIONS.put(
                ShipmentStatus.DELIVERED,
                EnumSet.noneOf(ShipmentStatus.class));

        VALID_TRANSITIONS.put(
                ShipmentStatus.CANCELLED,
                EnumSet.noneOf(ShipmentStatus.class));

        VALID_TRANSITIONS.put(
                ShipmentStatus.RETURNED,
                EnumSet.noneOf(ShipmentStatus.class));
    }

    private final TrackingEventRepository trackingEventRepository;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public TrackingServiceImpl(
            TrackingEventRepository trackingEventRepository,
            ShipmentRepository shipmentRepository,
            UserRepository userRepository,
            NotificationService notificationService) {

        this.trackingEventRepository = trackingEventRepository;
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingStatusResponse getTrackingStatus(String trackingNumber) {
        String normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
        TrackingEvent latestEvent = findLatestEventOrNull(normalizedTrackingNumber);

        if (latestEvent != null) {
            TrackingEvent latestLocationEvent = findLatestLocationEventOrNull(normalizedTrackingNumber);

            TrackingStatusResponse response = new TrackingStatusResponse();
            response.setTrackingNumber(latestEvent.getTrackingNumber());
            response.setCurrentStatus(latestEvent.getStatus());
            response.setLatestLocation(latestLocationEvent != null ? toLocationResponse(latestLocationEvent) : null);
            response.setLatestUpdateAt(latestEvent.getUpdatedAt());
            return response;
        }

        Shipment shipment = findShipmentOrNull(normalizedTrackingNumber);
        if (shipment == null) {
            throw notFound(normalizedTrackingNumber);
        }

        TrackingStatusResponse response = new TrackingStatusResponse();
        response.setTrackingNumber(shipment.getTrackingNumber());
        response.setCurrentStatus(shipment.getShipmentStatus());
        response.setLatestLocation(null);
        response.setLatestUpdateAt(shipment.getUpdatedAt());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingTimelineResponse getTrackingTimeline(String trackingNumber) {
        String normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
        List<TrackingEvent> events = trackingEventRepository
                .findByTrackingNumberOrderByUpdatedAtAsc(normalizedTrackingNumber);

        if (events.isEmpty()) {
            throw notFound(normalizedTrackingNumber);
        }

        TrackingTimelineResponse response = new TrackingTimelineResponse();
        response.setTrackingNumber(normalizedTrackingNumber);
        response.setEvents(events.stream().map(this::toLocationResponse).toList());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingLocationResponse getTrackingLocation(String trackingNumber) {
        TrackingEvent latestLocationEvent = findLatestLocationEvent(trackingNumber);
        return toLocationResponse(latestLocationEvent);
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryForecastResponse getDeliveryForecast(String trackingNumber) {
        String normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
        Shipment shipment = findShipment(normalizedTrackingNumber);
        TrackingEvent latestEvent = findLatestEventOrNull(normalizedTrackingNumber);
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime expectedDelivery = shipment.getExpectedDeliveryDate() == null
                ? null
                : shipment.getExpectedDeliveryDate()
                        .atStartOfDay()
                        .atOffset(java.time.ZoneOffset.UTC);

        DeliveryForecastResponse response = new DeliveryForecastResponse();
        response.setTrackingNumber(normalizedTrackingNumber);

        if (shipment.getShipmentStatus() == ShipmentStatus.DELIVERED) {
            response.setPredictedDeliveryAt(latestEvent != null ? latestEvent.getUpdatedAt() : now);
            response.setPredictedDelayMinutes(0);
            response.setConfidencePercentage(100);
            response.setRiskLevel("DELIVERED");
            response.setReason("Delivery has been confirmed.");
            return response;
        }

        long remainingMinutes = remainingMinutes(shipment.getShipmentStatus());
        boolean staleUpdate = latestEvent != null && latestEvent.getUpdatedAt().isBefore(now.minusHours(8));
        if (staleUpdate) {
            remainingMinutes += 120;
        }

        OffsetDateTime predictedDelivery = now.plusMinutes(remainingMinutes);
        long delayMinutes = expectedDelivery == null || !predictedDelivery.isAfter(expectedDelivery)
                ? 0
                : Duration.between(expectedDelivery, predictedDelivery).toMinutes();

        response.setPredictedDeliveryAt(predictedDelivery);
        response.setPredictedDelayMinutes(delayMinutes);
        response.setConfidencePercentage(Math.max(55, staleUpdate ? 65 : 82));
        response.setRiskLevel(delayMinutes > 240 ? "HIGH" : delayMinutes > 0 || staleUpdate ? "WATCH" : "ON_TRACK");
        response.setReason(buildForecastReason(shipment.getShipmentStatus(), staleUpdate, delayMinutes));
        return response;
    }

    @Override
    @Transactional
    public TrackingStatusResponse updateTrackingStatus(UpdateTrackingStatusRequest request) {
        String trackingNumber = normalizeTrackingNumber(request.getTrackingNumber());
        Shipment shipment = findShipment(trackingNumber);
        validateStatusTransition(
                shipment.getShipmentStatus(),
                request.getStatus());

        TrackingEvent event = new TrackingEvent();
        event.setShipment(shipment);
        event.setTrackingNumberCache(trackingNumber);
        event.setStatus(request.getStatus());
        event.setDescription(request.getDescription().trim());
        event.setUpdatedBy(getCurrentUsername());
        event.setUpdatedAt(OffsetDateTime.now());

        TrackingEvent savedEvent = trackingEventRepository.save(event);

        shipment.setShipmentStatus(request.getStatus());

        shipment.setEstimatedArrival(
                calculateEstimatedArrival(shipment));

        shipmentRepository.save(shipment);
        sendShipmentStatusNotifications(shipment, request.getStatus());

        TrackingStatusResponse response = new TrackingStatusResponse();
        response.setTrackingNumber(savedEvent.getTrackingNumber());
        response.setCurrentStatus(savedEvent.getStatus());
        TrackingEvent latestLocationEvent = findLatestLocationEventOrNull(savedEvent.getTrackingNumber());
        response.setLatestLocation(latestLocationEvent != null ? toLocationResponse(latestLocationEvent) : null);
        response.setLatestUpdateAt(savedEvent.getUpdatedAt());
        return response;
    }

    @Override
    @Transactional
    public TrackingLocationResponse updateLocation(UpdateLocationRequest request) {
        String trackingNumber = normalizeTrackingNumber(request.getTrackingNumber());
        Shipment shipment = findShipment(trackingNumber);
        TrackingEvent latestEvent = findLatestEventOrNull(trackingNumber);

        TrackingEvent event = new TrackingEvent();
        event.setShipment(shipment);
        event.setTrackingNumberCache(trackingNumber);
        event.setStatus(latestEvent != null ? latestEvent.getStatus() : shipment.getShipmentStatus());
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
        event.setLocationName(request.getLocationName().trim());
        event.setDescription(request.getDescription().trim());
        event.setUpdatedBy(getCurrentUsername());
        event.setUpdatedAt(OffsetDateTime.now());

        TrackingEvent savedEvent = trackingEventRepository.save(event);
        return toLocationResponse(savedEvent);
    }

    @Override
    @Transactional
    public void recordShipmentCreated(String trackingNumber) {
        String normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
        Shipment shipment = findShipment(normalizedTrackingNumber);

        if (trackingEventRepository.existsByTrackingNumber(normalizedTrackingNumber)) {
            return;
        }

        TrackingEvent event = new TrackingEvent();
        event.setShipment(shipment);
        event.setTrackingNumberCache(normalizedTrackingNumber);
        event.setStatus(ShipmentStatus.CREATED);
        event.setDescription("Shipment Created");
        event.setUpdatedBy(SYSTEM_USER);
        event.setUpdatedAt(OffsetDateTime.now());

        trackingEventRepository.save(event);
    }

    private TrackingEvent findLatestEventOrNull(String trackingNumber) {
        return trackingEventRepository.findFirstByTrackingNumberOrderByUpdatedAtDesc(trackingNumber)
                .orElse(null);
    }

    private TrackingEvent findLatestLocationEventOrNull(String trackingNumber) {
        String normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);

        TrackingEvent eventWithLocation = trackingEventRepository
                .findFirstByTrackingNumberAndLocationNameIsNotNullOrderByUpdatedAtDesc(normalizedTrackingNumber)
                .orElse(null);

        if (eventWithLocation != null && hasLocationData(eventWithLocation)) {
            return eventWithLocation;
        }

        return trackingEventRepository.findByTrackingNumberOrderByUpdatedAtAsc(normalizedTrackingNumber)
                .stream()
                .filter(this::hasLocationData)
                .reduce((first, second) -> second)
                .orElse(null);
    }

    private TrackingEvent findLatestLocationEvent(String trackingNumber) {
        TrackingEvent latestLocationEvent = findLatestLocationEventOrNull(trackingNumber);

        if (latestLocationEvent == null) {
            throw notFound(normalizeTrackingNumber(trackingNumber));
        }

        return latestLocationEvent;
    }

    private boolean hasLocationData(TrackingEvent event) {
        return event.getLatitude() != null
                || event.getLongitude() != null
                || (event.getLocationName() != null && !event.getLocationName().isBlank());
    }

    private long remainingMinutes(ShipmentStatus status) {
        return switch (status) {
            case CREATED -> 1_440;
            case PICKED_UP -> 960;
            case IN_TRANSIT -> 480;
            case OUT_FOR_DELIVERY -> 120;
            case FAILED_DELIVERY -> 240;
            case CANCELLED, RETURNED, DELIVERED -> 0;
        };
    }

    private OffsetDateTime calculateEstimatedArrival(Shipment shipment) {

        if (shipment.getShipmentStatus() == ShipmentStatus.DELIVERED) {
            return OffsetDateTime.now();
        }

        if (shipment.getShipmentStatus() == ShipmentStatus.CANCELLED
                || shipment.getShipmentStatus() == ShipmentStatus.RETURNED
                || shipment.getShipmentStatus() == ShipmentStatus.FAILED_DELIVERY) {
            return null;
        }

        return OffsetDateTime.now()
                .plusMinutes(remainingMinutes(shipment.getShipmentStatus()));
    }

    private String buildForecastReason(ShipmentStatus status, boolean staleUpdate, long delayMinutes) {
        if (status == ShipmentStatus.CANCELLED || status == ShipmentStatus.RETURNED) {
            return "This shipment is no longer progressing through delivery.";
        }
        if (status == ShipmentStatus.FAILED_DELIVERY) {
            return "Delivery attempt failed. A re-attempt or return will be scheduled.";
        }
        if (delayMinutes > 0) {
            return "Current " + status + " progress indicates a forecast delay of about " + delayMinutes + " minutes.";
        }
        if (staleUpdate) {
            return "No recent tracking update was received; the ETA is being monitored.";
        }
        return "The shipment is " + status + " and is currently forecast to meet its ETA.";
    }

    private TrackingLocationResponse toLocationResponse(TrackingEvent event) {
        if (event == null) {
            return null;
        }

        TrackingLocationResponse response = new TrackingLocationResponse();
        response.setTrackingNumber(event.getTrackingNumber());
        response.setStatus(event.getStatus());
        response.setLatitude(event.getLatitude());
        response.setLongitude(event.getLongitude());
        response.setLocationName(event.getLocationName());
        response.setDescription(event.getDescription());
        response.setUpdatedBy(event.getUpdatedBy());
        response.setUpdatedAt(event.getUpdatedAt());
        return response;
    }

    private void validateStatusTransition(
            ShipmentStatus currentStatus,
            ShipmentStatus newStatus) {

        if (currentStatus == newStatus) {
            return;
        }

        Set<ShipmentStatus> allowedStatuses = VALID_TRANSITIONS.getOrDefault(
                currentStatus,
                EnumSet.noneOf(ShipmentStatus.class));

        if (!allowedStatuses.contains(newStatus)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid shipment status transition from "
                            + currentStatus
                            + " to "
                            + newStatus);
        }
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return "SYSTEM";
        }

        return authentication.getName();
    }

    private String normalizeTrackingNumber(String trackingNumber) {
        if (trackingNumber == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "trackingNumber is required");
        }

        String normalized = trackingNumber.trim();
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "trackingNumber is required");
        }

        return normalized;
    }

    private Shipment findShipment(String trackingNumber) {
        Shipment shipment = findShipmentOrNull(trackingNumber);
        if (shipment == null) {
            throw notFound(trackingNumber);
        }
        return shipment;
    }

    private Shipment findShipmentOrNull(String trackingNumber) {
        return shipmentRepository.findByTrackingNumber(trackingNumber).orElse(null);
    }

    private ResponseStatusException notFound(String trackingNumber) {
        return new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No tracking history found for tracking number: " + trackingNumber);
    }

    private void sendShipmentStatusNotifications(
            Shipment shipment,
            ShipmentStatus status) {

        if (shipment.getUserId() == null) {
            return;
        }

        User user = userRepository.findById(shipment.getUserId())
                .orElse(null);

        if (user == null) {
            return;
        }

        NotificationEventType eventType = mapEventType(status);

        String title = "Shipment Status Updated";

        String message = "Shipment "
                + shipment.getTrackingNumber()
                + " status changed to "
                + status.name().replace('_', ' ');

        notificationService.createNotification(
                user,
                shipment,
                eventType,
                NotificationChannel.PUSH,
                title,
                message);
    }

    private NotificationEventType mapEventType(ShipmentStatus status) {

        return switch (status) {

            case PICKED_UP -> NotificationEventType.PICKED_UP;

            case IN_TRANSIT -> NotificationEventType.IN_TRANSIT;

            case OUT_FOR_DELIVERY -> NotificationEventType.OUT_FOR_DELIVERY;

            case DELIVERED -> NotificationEventType.DELIVERED;

            case FAILED_DELIVERY -> NotificationEventType.SHIPMENT_CREATED;

            default -> NotificationEventType.SHIPMENT_CREATED;
        };
    }

}
