package com.shiptrackpro.controller;

import com.shiptrackpro.dto.TrackingLocationResponse;
import com.shiptrackpro.dto.TrackingStatusResponse;
import com.shiptrackpro.dto.TrackingTimelineResponse;
import com.shiptrackpro.dto.UpdateLocationRequest;
import com.shiptrackpro.dto.UpdateTrackingStatusRequest;
import com.shiptrackpro.service.TrackingService;
import jakarta.validation.Valid;
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