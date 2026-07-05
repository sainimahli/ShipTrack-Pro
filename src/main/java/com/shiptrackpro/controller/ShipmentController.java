package com.shiptrackpro.controller;

import com.shiptrackpro.dto.ShipmentRequest;
import com.shiptrackpro.dto.ShipmentResponse;
import jakarta.validation.Valid;
import com.shiptrackpro.service.ShipmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST API for the Shipment Management Module.
 *
 * <p>Delegates all business logic to {@link ShipmentService} and deals only
 * in request/response DTOs — the {@code Shipment} entity is never exposed
 * directly over the API.</p>
 */
@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentService shipmentService;

    /**
     * Constructor injection — preferred over field injection for
     * testability and immutability of dependencies.
     */
    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    /**
     * Creates a new shipment.
     *
     * @param request validated shipment details
     * @return 201 Created with the newly created shipment, including its
     *         generated id and tracking number
     */
    @PostMapping
    public ResponseEntity<ShipmentResponse> createShipment(@Valid @RequestBody ShipmentRequest request) {
        ShipmentResponse response = shipmentService.createShipment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieves all shipments.
     *
     * @return 200 OK with the full list of shipments
     */
    @GetMapping
    public ResponseEntity<List<ShipmentResponse>> getAllShipments() {
        return ResponseEntity.ok(shipmentService.getAllShipments());
    }

    /**
     * Retrieves a single shipment by id.
     *
     * @param id shipment id
     * @return 200 OK with the matching shipment
     */
    @GetMapping("/{id}")
    public ResponseEntity<ShipmentResponse> getShipmentById(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.getShipmentById(id));
    }

    /**
     * Updates an existing shipment's mutable details.
     *
     * @param id      id of the shipment to update
     * @param request updated shipment details
     * @return 200 OK with the updated shipment
     */
    @PutMapping("/{id}")
    public ResponseEntity<ShipmentResponse> updateShipment(
            @PathVariable Long id,
            @Valid @RequestBody ShipmentRequest request) {
        return ResponseEntity.ok(shipmentService.updateShipment(id, request));
    }

    /**
     * Cancels a shipment. Implemented as a soft-cancel (status set to
     * {@code CANCELLED}) rather than a hard delete, so tracking history is
     * preserved — see {@code ShipmentServiceImpl.cancelShipment}.
     *
     * @param id id of the shipment to cancel
     * @return 200 OK with the cancelled shipment
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ShipmentResponse> cancelShipment(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.cancelShipment(id));
    }

}
