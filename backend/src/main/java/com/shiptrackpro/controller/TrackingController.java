package com.shiptrackpro.controller;

import com.shiptrackpro.dto.MapConfigResponse;
import com.shiptrackpro.dto.TrackingLocationResponse;
import com.shiptrackpro.dto.DeliveryForecastResponse;
import com.shiptrackpro.dto.TrackingStatusResponse;
import com.shiptrackpro.dto.TrackingTimelineResponse;
import com.shiptrackpro.dto.UpdateLocationRequest;
import com.shiptrackpro.dto.UpdateTrackingStatusRequest;
import com.shiptrackpro.service.TrackingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tracking")
@CrossOrigin(origins = "*")
public class TrackingController {

    private final TrackingService trackingService;

    @Value("${google.maps.api-key:}")
    private String googleMapsApiKey;

    @Value("${google.maps.default-center:12.9716,77.5946}")
    private String defaultCenter;

    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @GetMapping("/{trackingNumber}")
    public ResponseEntity<TrackingStatusResponse> getTrackingStatus(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(trackingService.getTrackingStatus(trackingNumber));
    }

    @GetMapping("/timeline/{trackingNumber}")
    public ResponseEntity<TrackingTimelineResponse> getTimeline(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(trackingService.getTrackingTimeline(trackingNumber));
    }

    @GetMapping("/location/{trackingNumber}")
    public ResponseEntity<TrackingLocationResponse> getLatestLocation(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(trackingService.getTrackingLocation(trackingNumber));
    }

    @GetMapping("/forecast/{trackingNumber}")
    public ResponseEntity<DeliveryForecastResponse> getDeliveryForecast(@PathVariable String trackingNumber) {
        return ResponseEntity.ok(trackingService.getDeliveryForecast(trackingNumber));
    }

    @GetMapping("/map-config")
    public ResponseEntity<MapConfigResponse> getMapConfig() {
        return ResponseEntity.ok(new MapConfigResponse(googleMapsApiKey, defaultCenter));
    }

    @PutMapping("/status")
    public ResponseEntity<TrackingStatusResponse> updateStatus(
            @Valid @RequestBody UpdateTrackingStatusRequest request) {

        return ResponseEntity.ok(trackingService.updateTrackingStatus(request));
    }

    @PostMapping("/location")
    public ResponseEntity<TrackingLocationResponse> updateLocation(
            @Valid @RequestBody UpdateLocationRequest request) {

        return ResponseEntity.ok(trackingService.updateLocation(request));
    }
}
