package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.TrackingLocationResponse;
import com.shiptrackpro.dto.DeliveryForecastResponse;
import com.shiptrackpro.dto.TrackingStatusResponse;
import com.shiptrackpro.dto.TrackingTimelineResponse;
import com.shiptrackpro.dto.UpdateLocationRequest;
import com.shiptrackpro.dto.UpdateTrackingStatusRequest;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.entity.TrackingEvent;
import com.shiptrackpro.entity.Address;
import com.shiptrackpro.enums.ShipmentStatus;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.repository.TrackingEventRepository;
import com.shiptrackpro.service.TrackingService;
import com.shiptrackpro.service.GoogleMapsService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.time.Duration;
import java.util.List;

@Service
public class TrackingServiceImpl implements TrackingService {

    private static final String SYSTEM_USER = "SYSTEM";

    private final TrackingEventRepository trackingEventRepository;
    private final ShipmentRepository shipmentRepository;
    private final GoogleMapsService googleMapsService;

    public TrackingServiceImpl(
            TrackingEventRepository trackingEventRepository,
            ShipmentRepository shipmentRepository,
            GoogleMapsService googleMapsService) {

        this.trackingEventRepository = trackingEventRepository;
        this.shipmentRepository = shipmentRepository;
        this.googleMapsService = googleMapsService;
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
        response.setLatestUpdateAt(shipment.getUpdatedAt() != null
                ? shipment.getUpdatedAt().atOffset(java.time.ZoneOffset.UTC)
                : null);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public TrackingTimelineResponse getTrackingTimeline(String trackingNumber) {
        String normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
        List<TrackingEvent> events = trackingEventRepository.findByTrackingNumberOrderByUpdatedAtAsc(normalizedTrackingNumber);

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
    @Transactional
    public DeliveryForecastResponse getDeliveryForecast(String trackingNumber) {
        String normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);
        Shipment shipment = findShipment(normalizedTrackingNumber);
        TrackingEvent latestEvent = findLatestEventOrNull(normalizedTrackingNumber);
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime expectedDelivery = shipment.getExpectedDeliveryDate() == null
                ? null
                : shipment.getExpectedDeliveryDate().atOffset(java.time.ZoneOffset.UTC);

        DeliveryForecastResponse response = new DeliveryForecastResponse();
        response.setTrackingNumber(normalizedTrackingNumber);

        if (shipment.getShipmentStatus() == ShipmentStatus.DELIVERED) {
            response.setPredictedDeliveryAt(latestEvent != null ? latestEvent.getUpdatedAt() : now);
            response.setPredictedDelayMinutes(0);
            response.setConfidencePercentage(100);
            response.setRiskLevel("DELIVERED");
            response.setReason("Delivery has been confirmed.");
            response.setRemainingDistanceKm(0.0);
            response.setRemainingDurationMinutes(0L);
            return response;
        }

        // Fetch origin & destination coordinates
        Double originLat = null;
        Double originLng = null;
        TrackingEvent latestLocationEvent = findLatestLocationEventOrNull(normalizedTrackingNumber);
        if (latestLocationEvent != null && latestLocationEvent.getLatitude() != null && latestLocationEvent.getLongitude() != null) {
            originLat = latestLocationEvent.getLatitude();
            originLng = latestLocationEvent.getLongitude();
        } else {
            Address originAddr = shipment.getOriginAddress();
            if (originAddr.getLatitude() == null) {
                googleMapsService.geocodeAddress(originAddr);
            }
            originLat = originAddr.getLatitude();
            originLng = originAddr.getLongitude();
        }

        Address destAddr = shipment.getDestinationAddress();
        if (destAddr.getLatitude() == null) {
            googleMapsService.geocodeAddress(destAddr);
        }
        Double destLat = destAddr.getLatitude();
        Double destLng = destAddr.getLongitude();

        // Calculate dynamic distance and duration using Google Maps (with Haversine fallback)
        GoogleMapsService.RouteDetails route = googleMapsService.calculateRoute(originLat, originLng, destLat, destLng);
        double distanceKm = route.getDistanceKm();
        long durationMinutes = route.getDurationMinutes();

        boolean staleUpdate = latestEvent != null && latestEvent.getUpdatedAt().isBefore(now.minusHours(8));
        if (staleUpdate) {
            durationMinutes += 120;
        }

        OffsetDateTime predictedDelivery = now.plusMinutes(durationMinutes);
        long delayMinutes = expectedDelivery == null || !predictedDelivery.isAfter(expectedDelivery)
                ? 0
                : Duration.between(expectedDelivery, predictedDelivery).toMinutes();

        response.setPredictedDeliveryAt(predictedDelivery);
        response.setPredictedDelayMinutes(delayMinutes);
        response.setConfidencePercentage(Math.max(55, staleUpdate ? 65 : 82));
        response.setRiskLevel(delayMinutes > 240 ? "HIGH" : delayMinutes > 0 || staleUpdate ? "WATCH" : "ON_TRACK");
        response.setRemainingDistanceKm(distanceKm);
        response.setRemainingDurationMinutes(durationMinutes);

        String reason = buildForecastReason(shipment.getShipmentStatus(), staleUpdate, delayMinutes) 
                + " (Remaining: " + String.format("%.1f", distanceKm) + " km, Est. Duration: " + durationMinutes + " mins)";
        response.setReason(reason);
        return response;
    }

    @Override
    @Transactional
    public TrackingStatusResponse updateTrackingStatus(UpdateTrackingStatusRequest request) {
        String trackingNumber = normalizeTrackingNumber(request.getTrackingNumber());
        Shipment shipment = findShipment(trackingNumber);

        TrackingEvent event = new TrackingEvent();
        event.setShipment(shipment);
        event.setTrackingNumberCache(trackingNumber);
        event.setStatus(request.getStatus());
        event.setDescription(request.getDescription().trim());
        event.setUpdatedBy(SYSTEM_USER);
        event.setUpdatedAt(OffsetDateTime.now());

        TrackingEvent savedEvent = trackingEventRepository.save(event);

        shipment.setShipmentStatus(request.getStatus());
        shipmentRepository.save(shipment);

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
        event.setUpdatedBy(SYSTEM_USER);
        event.setUpdatedAt(OffsetDateTime.now());

        TrackingEvent savedEvent = trackingEventRepository.save(event);

        // Update current location coordinates in shipments table
        shipment.setCurrentLat(request.getLatitude());
        shipment.setCurrentLng(request.getLongitude());
        shipmentRepository.save(shipment);

        // Update Shipment ETA dynamically based on current location updates
        try {
            Address destAddr = shipment.getDestinationAddress();
            if (destAddr.getLatitude() == null) {
                googleMapsService.geocodeAddress(destAddr);
            }
            if (destAddr.getLatitude() != null && destAddr.getLongitude() != null) {
                GoogleMapsService.RouteDetails route = googleMapsService.calculateRoute(
                        request.getLatitude(), request.getLongitude(),
                        destAddr.getLatitude(), destAddr.getLongitude()
                );
                shipment.setExpectedDeliveryDate(java.time.LocalDateTime.now().plusMinutes(route.getDurationMinutes()));
                shipmentRepository.save(shipment);
            }
        } catch (Exception e) {
            // Log warning but proceed gracefully
        }

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

        Address origin = shipment.getOriginAddress();
        if (origin != null) {
            event.setLatitude(origin.getLatitude());
            event.setLongitude(origin.getLongitude());
            event.setLocationName(origin.getCity());
        }

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

    private String buildForecastReason(ShipmentStatus status, boolean staleUpdate, long delayMinutes) {
        if (status == ShipmentStatus.CANCELLED || status == ShipmentStatus.RETURNED) {
            return "This shipment is no longer progressing through delivery.";
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
                "No tracking history found for tracking number: " + trackingNumber
        );
    }
}
