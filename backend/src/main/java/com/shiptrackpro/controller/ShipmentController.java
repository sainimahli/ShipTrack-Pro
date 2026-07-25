package com.shiptrackpro.controller;

import com.shiptrackpro.dto.CreateShipmentRequest;
import com.shiptrackpro.dto.ForecastResponse;
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
 * <p>MODIFIED: {@code createShipment} now reads the authenticated
 * principal via {@code @AuthenticationPrincipal} (works as-is with the
 * existing {@code JwtAuthenticationFilter}/{@code CustomUserDetailsService},
 * since {@code User implements UserDetails}) instead of trusting a
 * client-supplied creator id. DTO types updated to
 * {@code CreateShipmentRequest}/{@code UpdateShipmentRequest}.</p>
 *
 * <p>Role restrictions below are commented rather than enforced, since the
 * exact policy per endpoint wasn't specified — uncomment and adjust once
 * confirmed, and add {@code @EnableMethodSecurity} to SecurityConfig if
 * it isn't already present.</p>
 */
@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentService shipmentService;

    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    // @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    @PostMapping
    public ResponseEntity<ShipmentResponse> createShipment(
            @Valid @RequestBody CreateShipmentRequest request,
            @AuthenticationPrincipal User currentUser) {
        ShipmentResponse response = shipmentService.createShipment(request, currentUser.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ShipmentResponse>> getAllShipments() {
        return ResponseEntity.ok(shipmentService.getAllShipments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShipmentResponse> getShipmentById(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.getShipmentById(id));
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ShipmentResponse> updateShipment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShipmentRequest request) {
        return ResponseEntity.ok(shipmentService.updateShipment(id, request));
    }

    // @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ShipmentResponse> deleteShipment(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.deleteShipment(id));
    }

    

}
