package com.shiptrackpro.controller;

import com.shiptrackpro.dto.TrackingLocationResponse;
import com.shiptrackpro.dto.DeliveryForecastResponse;
import com.shiptrackpro.dto.TrackingStatusResponse;
import com.shiptrackpro.dto.TrackingTimelineResponse;
import com.shiptrackpro.dto.UpdateLocationRequest;
import com.shiptrackpro.dto.UpdateTrackingStatusRequest;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.service.TrackingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API for live shipment tracking.
 *
 * <p>SECURITY: Customers may only track shipments they own.
 * If a CUSTOMER submits a tracking number that belongs to a different user,
 * the backend returns a 404 (Not Found) — deliberately not revealing
 * whether the tracking number is valid for another customer.</p>
 */
@RestController
@RequestMapping("/api/tracking")
@CrossOrigin(origins = "*")
public class TrackingController {

    private static final String ROLE_CUSTOMER = "CUSTOMER";

    private final TrackingService trackingService;
    private final ShipmentRepository shipmentRepository;

    public TrackingController(TrackingService trackingService,
                              ShipmentRepository shipmentRepository) {
        this.trackingService    = trackingService;
        this.shipmentRepository = shipmentRepository;
    }

    /**
     * Returns the tracking status for the given tracking number.
     *
     * <p>A CUSTOMER caller receives a 404 if the shipment does not belong to them,
     * without revealing that the tracking number exists for another user.</p>
     */
    @GetMapping("/{trackingNumber}")
    public ResponseEntity<TrackingStatusResponse> getTrackingStatus(
            @PathVariable String trackingNumber,
            @AuthenticationPrincipal User currentUser) {

        if (!isAllowedToTrack(trackingNumber, currentUser)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(trackingService.getTrackingStatus(trackingNumber));
    }

    /** Timeline visible to any authenticated user, but customer-scoped. */
    @GetMapping("/timeline/{trackingNumber}")
    public ResponseEntity<TrackingTimelineResponse> getTimeline(
            @PathVariable String trackingNumber,
            @AuthenticationPrincipal User currentUser) {

        if (!isAllowedToTrack(trackingNumber, currentUser)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(trackingService.getTrackingTimeline(trackingNumber));
    }

    /** Location visible to any authenticated user, but customer-scoped. */
    @GetMapping("/location/{trackingNumber}")
    public ResponseEntity<TrackingLocationResponse> getLatestLocation(
            @PathVariable String trackingNumber,
            @AuthenticationPrincipal User currentUser) {

        if (!isAllowedToTrack(trackingNumber, currentUser)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(trackingService.getTrackingLocation(trackingNumber));
    }

    /** Forecast visible to any authenticated user, but customer-scoped. */
    @GetMapping("/forecast/{trackingNumber}")
    public ResponseEntity<DeliveryForecastResponse> getDeliveryForecast(
            @PathVariable String trackingNumber,
            @AuthenticationPrincipal User currentUser) {

        if (!isAllowedToTrack(trackingNumber, currentUser)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(trackingService.getDeliveryForecast(trackingNumber));
    }

    /** Update status — LOGISTICS_OPERATOR / ADMIN only (enforced in SecurityConfig). */
    @PutMapping("/status")
    public ResponseEntity<TrackingStatusResponse> updateStatus(
            @Valid @RequestBody UpdateTrackingStatusRequest request) {
        return ResponseEntity.ok(trackingService.updateTrackingStatus(request));
    }

    /** Route history visible to any authenticated user, but customer-scoped. */
    @GetMapping("/history/{trackingNumber}")
    public ResponseEntity<TrackingTimelineResponse> getRouteHistory(
            @PathVariable String trackingNumber,
            @AuthenticationPrincipal User currentUser) {

        if (!isAllowedToTrack(trackingNumber, currentUser)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(trackingService.getRouteHistory(trackingNumber));
    }

    /** Update location — LOGISTICS_OPERATOR only (enforced in SecurityConfig). */
    @PutMapping("/location")
    public ResponseEntity<TrackingLocationResponse> updateLocation(
            @Valid @RequestBody UpdateLocationRequest request) {
        return ResponseEntity.ok(trackingService.updateLocation(request));
    }

    // -----------------------------------------------------------------------
    // Helper
    // -----------------------------------------------------------------------

    /**
     * Returns {@code true} when the caller is allowed to view this tracking
     * number.
     * <ul>
     *   <li>Non-customer roles (LOGISTICS_OPERATOR, ADMINISTRATOR, etc.) — always allowed.</li>
     *   <li>CUSTOMER — allowed only if the shipment's userId matches theirs.</li>
     *   <li>Tracking number not found — returns {@code false} (results in 404).</li>
     * </ul>
     */
    private boolean isAllowedToTrack(String trackingNumber, User currentUser) {
        String roleName = currentUser.getRole().getRoleName();
        if (!ROLE_CUSTOMER.equalsIgnoreCase(roleName)) {
            return true; // operators/admins can track any shipment
        }
        return shipmentRepository.findByTrackingNumber(trackingNumber)
                .map(shipment -> currentUser.getUserId().equals(shipment.getUserId()))
                .orElse(false); // tracking number not found → deny silently
    }
}
