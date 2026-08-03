package com.shiptrackpro.controller;

import com.shiptrackpro.dto.DeliveryConfirmationRequest;
import com.shiptrackpro.dto.DeliveryConfirmationResponse;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.service.DeliveryConfirmationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Standalone controller under /api/shipments - Spring allows multiple
 * @RestController classes to share a base path as long as individual
 * endpoint paths don't collide, so this doesn't require editing your
 * existing ShipmentController.
 */
@RestController
@RequestMapping("/api/shipments")
public class DeliveryConfirmationController {

    private final DeliveryConfirmationService deliveryConfirmationService;

    public DeliveryConfirmationController(DeliveryConfirmationService deliveryConfirmationService) {
        this.deliveryConfirmationService = deliveryConfirmationService;
    }

    @PostMapping("/{shipmentId}/delivery-confirmation")
    public ResponseEntity<DeliveryConfirmationResponse> confirmDelivery(
            @PathVariable Long shipmentId,
            @Valid @RequestBody DeliveryConfirmationRequest request,
            @AuthenticationPrincipal User currentUser) {

        Long confirmedByUserId = currentUser != null ? currentUser.getUserId() : null;
        DeliveryConfirmationResponse response =
                deliveryConfirmationService.confirmDelivery(shipmentId, request, confirmedByUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{shipmentId}/delivery-confirmation")
    public ResponseEntity<DeliveryConfirmationResponse> getConfirmation(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(deliveryConfirmationService.getConfirmation(shipmentId));
    }

}
