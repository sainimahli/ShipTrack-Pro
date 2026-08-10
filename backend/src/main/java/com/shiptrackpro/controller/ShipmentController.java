package com.shiptrackpro.controller;

import com.shiptrackpro.dto.CreateShipmentRequest;
import com.shiptrackpro.dto.ShipmentResponse;
import com.shiptrackpro.dto.UpdateShipmentRequest;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.service.ShipmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
 * REST API for the Shipment Management Workflow.
 *
 * <p>SECURITY: {@code getAllShipments} now enforces customer data isolation
 * server-side.  When the authenticated principal has role CUSTOMER, only
 * shipments whose {@code userId} matches the caller are returned.
 * LOGISTICS_OPERATOR and ADMINISTRATOR receive the full list.
 * This prevents customers from manipulating URL/query parameters to view
 * other customers' shipments.</p>
 *
 * <p>{@code createShipment} continues to read the owner from the JWT
 * principal — the frontend must NOT supply a {@code userId} field.</p>
 */
@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private static final String ROLE_CUSTOMER = "CUSTOMER";

    private final ShipmentService shipmentService;

    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    /** Create a shipment; owner is taken from the JWT, never from the body. */
    @PostMapping
    public ResponseEntity<ShipmentResponse> createShipment(
            @Valid @RequestBody CreateShipmentRequest request,
            @AuthenticationPrincipal User currentUser) {
        ShipmentResponse response = shipmentService.createShipment(request, currentUser.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Returns shipments scoped to the caller's role:
     * <ul>
     *   <li>CUSTOMER → only their own shipments (userId match enforced server-side)</li>
     *   <li>LOGISTICS_OPERATOR / ADMINISTRATOR → all shipments</li>
     * </ul>
     */
    @GetMapping
    public ResponseEntity<List<ShipmentResponse>> getAllShipments(
            @AuthenticationPrincipal User currentUser) {

        String roleName = currentUser.getRole().getRoleName();

        if (ROLE_CUSTOMER.equalsIgnoreCase(roleName)) {
            return ResponseEntity.ok(shipmentService.getMyShipments(currentUser.getUserId()));
        }

        return ResponseEntity.ok(shipmentService.getAllShipments());
    }

    /**
     * Get a single shipment by its internal database id.
     * CUSTOMER callers are denied access to shipments they do not own (403).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ShipmentResponse> getShipmentById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {

        ShipmentResponse response = shipmentService.getShipmentById(id);

        String roleName = currentUser.getRole().getRoleName();
        if (ROLE_CUSTOMER.equalsIgnoreCase(roleName)
                && !currentUser.getUserId().equals(response.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(response);
    }

    /** Update mutable shipment fields (LOGISTICS_OPERATOR / ADMINISTRATOR only — enforced in SecurityConfig). */
    @PutMapping("/{id}")
    public ResponseEntity<ShipmentResponse> updateShipment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShipmentRequest request) {
        return ResponseEntity.ok(shipmentService.updateShipment(id, request));
    }

    /** Soft-cancel (ADMINISTRATOR only — enforced in SecurityConfig). */
    @DeleteMapping("/{id}")
    public ResponseEntity<ShipmentResponse> deleteShipment(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.deleteShipment(id));
    }
}
