package com.shiptrackpro.controller;

import com.shiptrackpro.dto.DelayPredictionRequest;
import com.shiptrackpro.dto.DelayPredictionResponse;
import com.shiptrackpro.service.DelayPredictionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes delay prediction for a shipment.
 *
 * <p>Endpoint design note: this is POST rather than GET, since a
 * prediction depends on live signals (traffic, weather, distance
 * remaining) that must be supplied in a request body — there's no
 * equivalent stored resource to simply fetch.</p>
 */
@RestController
@RequestMapping("/api/shipments")
public class DelayPredictionController {

    private final DelayPredictionService delayPredictionService;

    public DelayPredictionController(DelayPredictionService delayPredictionService) {
        this.delayPredictionService = delayPredictionService;
    }

    /**
     * POST /api/shipments/{id}/predict-delay
     *
     * Body is optional — omit it entirely (or send {}) to get a prediction
     * based purely on shipment status and ETA, with no live traffic/
     * weather/distance signals factored in.
     */
    @PostMapping("/{id}/predict-delay")
    public ResponseEntity<DelayPredictionResponse> predictDelay(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) DelayPredictionRequest request) {
        DelayPredictionResponse response = delayPredictionService.predictDelay(id, request);
        return ResponseEntity.ok(response);
    }

}
