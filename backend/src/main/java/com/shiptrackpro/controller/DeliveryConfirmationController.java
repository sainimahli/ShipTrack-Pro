package com.shiptrackpro.controller;

import com.shiptrackpro.dto.DeliveryConfirmationRequest;
import com.shiptrackpro.dto.DeliveryConfirmationResponse;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.service.DeliveryConfirmationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.shiptrackpro.dto.DeliveryOtpVerificationRequest;

@RestController
@RequestMapping("/api/shipments")
public class DeliveryConfirmationController {

    private final DeliveryConfirmationService deliveryConfirmationService;

    public DeliveryConfirmationController(
            DeliveryConfirmationService deliveryConfirmationService) {

        this.deliveryConfirmationService = deliveryConfirmationService;
    }


    // Send OTP to customer
    @PostMapping("/{shipmentId}/delivery-confirmation/send-otp")
    public ResponseEntity<String> sendDeliveryOtp(
            @PathVariable Long shipmentId) {

        deliveryConfirmationService.sendDeliveryOtp(shipmentId);

        return ResponseEntity.ok("Delivery OTP sent successfully");
    }
    // Verify OTP and confirm delivery
    @PostMapping("/{shipmentId}/delivery-confirmation/verify-otp")
    public ResponseEntity<DeliveryConfirmationResponse> verifyDeliveryOtp(
            @PathVariable Long shipmentId,
            @Valid @RequestBody DeliveryOtpVerificationRequest request,
            @AuthenticationPrincipal User currentUser) {

        Long confirmedByUserId =
                currentUser != null ? currentUser.getUserId() : null;

        DeliveryConfirmationResponse response =
                deliveryConfirmationService.verifyDeliveryOtp(
                        shipmentId,
                        request.getOtp(),
                        request,
                        confirmedByUserId
                );

        return ResponseEntity.ok(response);
    }

    // Existing confirmation
    @PostMapping("/{shipmentId}/delivery-confirmation")
    public ResponseEntity<DeliveryConfirmationResponse> confirmDelivery(
            @PathVariable Long shipmentId,
            @Valid @RequestBody DeliveryConfirmationRequest request,
            @AuthenticationPrincipal User currentUser) {

        Long confirmedByUserId =
                currentUser != null ? currentUser.getUserId() : null;

        DeliveryConfirmationResponse response =
                deliveryConfirmationService.confirmDelivery(
                        shipmentId,
                        request,
                        confirmedByUserId
                );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    // Get confirmation
    @GetMapping("/{shipmentId}/delivery-confirmation")
    public ResponseEntity<DeliveryConfirmationResponse> getConfirmation(
            @PathVariable Long shipmentId) {

        return ResponseEntity.ok(
                deliveryConfirmationService.getConfirmation(shipmentId)
        );
    }
}