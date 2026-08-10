package com.shiptrackpro.controller;

import com.shiptrackpro.dto.PodConfirmationRequest;
import com.shiptrackpro.dto.PodConfirmationResponse;
import com.shiptrackpro.service.PodConfirmationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.shiptrackpro.dto.PodConfirmationListResponse;
import java.util.List;

@RestController
@RequestMapping("/api/pod/confirmation")
public class PodConfirmationController {

    private final PodConfirmationService podConfirmationService;

    public PodConfirmationController(
            PodConfirmationService podConfirmationService) {
        this.podConfirmationService = podConfirmationService;
    }

    @PostMapping
    public ResponseEntity<PodConfirmationResponse> createConfirmation(
            @ModelAttribute PodConfirmationRequest request) {

        PodConfirmationResponse response = podConfirmationService.createConfirmation(request);

        return ResponseEntity.status(201).body(response);
    }

    @PostMapping("/{confirmationId}/confirm")
    public ResponseEntity<PodConfirmationResponse> confirmDelivery(
            @PathVariable Long confirmationId) {

        PodConfirmationResponse response = podConfirmationService.confirmDelivery(confirmationId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<List<PodConfirmationListResponse>> getAllConfirmations() {

        List<PodConfirmationListResponse> response = podConfirmationService.getAllConfirmations();

        return ResponseEntity.ok(response);
    }
}