package com.shiptrackpro.controller;

import com.shiptrackpro.dto.AlertRequest;
import com.shiptrackpro.dto.AlertResponse;
import com.shiptrackpro.service.AlertService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Standalone controller (not merged into your existing ShipmentController)
 * so this doesn't require editing a file I can't see. Endpoints match
 * your spec exactly, including the ones under /api/shipments/{id}/alerts.
 */
@RestController
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping("/api/shipments/{shipmentId}/alerts")
    public ResponseEntity<List<AlertResponse>> getAlertsByShipment(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(alertService.getAlertsByShipment(shipmentId));
    }

    @PostMapping("/api/shipments/{shipmentId}/alerts")
    public ResponseEntity<AlertResponse> createAlert(
            @PathVariable Long shipmentId,
            @Valid @RequestBody AlertRequest request) {
        AlertResponse response = alertService.createAlert(shipmentId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/api/alerts/{alertId}/read")
    public ResponseEntity<AlertResponse> markAsRead(@PathVariable Long alertId) {
        return ResponseEntity.ok(alertService.markAsRead(alertId));
    }

}
