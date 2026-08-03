package com.shiptrackpro.controller;

import com.shiptrackpro.entity.RouteHistory;
import com.shiptrackpro.service.RouteHistoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller for managing shipment route histories.
 */
@RestController
@RequestMapping("/api/route-history")
public class RouteHistoryController {

    private final RouteHistoryService routeHistoryService;

    public RouteHistoryController(RouteHistoryService routeHistoryService) {
        this.routeHistoryService = routeHistoryService;
    }

    /**
     * Save a location history point.
     * POST /api/route-history
     *
     * @param routeHistory the RouteHistory record to save
     * @return the saved RouteHistory record
     */
    @PostMapping
    public ResponseEntity<RouteHistory> saveRouteHistory(@jakarta.validation.Valid @RequestBody RouteHistory routeHistory) {
        RouteHistory saved = routeHistoryService.saveRouteHistory(routeHistory);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Get route history for a shipment, sorted by timestamp ascending.
     * GET /api/route-history/{shipmentId}
     *
     * @param shipmentId the ID or tracking number of the shipment
     * @return list of RouteHistory records
     */
    @GetMapping("/{shipmentId}")
    public ResponseEntity<List<RouteHistory>> getRouteHistory(@PathVariable String shipmentId) {
        List<RouteHistory> history = routeHistoryService.getRouteHistoryByShipmentId(shipmentId);
        return ResponseEntity.ok(history);
    }

    /**
     * Delete a route history record by its ID.
     * DELETE /api/route-history/{id}
     *
     * @param id the ID of the RouteHistory record to delete
     * @return no content on success
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRouteHistory(@PathVariable Long id) {
        routeHistoryService.deleteRouteHistory(id);
        return ResponseEntity.noContent().build();
    }
}
