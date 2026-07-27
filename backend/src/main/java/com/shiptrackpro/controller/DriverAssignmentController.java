package com.shiptrackpro.controller;

import com.shiptrackpro.dto.ShipmentResponse;
import com.shiptrackpro.service.DriverAssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Standalone controller sharing the /api/shipments base path with your
 * existing ShipmentController - Spring allows this across separate
 * @RestController classes as long as individual paths don't collide, so
 * this doesn't require editing your existing controller file.
 */
@RestController
public class DriverAssignmentController {

    private final DriverAssignmentService driverAssignmentService;

    public DriverAssignmentController(DriverAssignmentService driverAssignmentService) {
        this.driverAssignmentService = driverAssignmentService;
    }

    @PutMapping("/api/shipments/{shipmentId}/assign-driver/{driverId}")
    public ResponseEntity<ShipmentResponse> assignDriver(
            @PathVariable Long shipmentId,
            @PathVariable Long driverId) {
        return ResponseEntity.ok(driverAssignmentService.assignDriver(shipmentId, driverId));
    }

    @PutMapping("/api/shipments/{shipmentId}/assign-vehicle/{vehicleId}")
    public ResponseEntity<ShipmentResponse> assignVehicle(
            @PathVariable Long shipmentId,
            @PathVariable Long vehicleId) {
        return ResponseEntity.ok(driverAssignmentService.assignVehicle(shipmentId, vehicleId));
    }

}
