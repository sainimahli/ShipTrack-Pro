package com.shiptrackpro.controller;

import com.shiptrackpro.dto.ProofOfDeliveryRequest;
import com.shiptrackpro.dto.ProofOfDeliveryResponse;
import com.shiptrackpro.service.ProofOfDeliveryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.shiptrackpro.dto.ProofOfDeliveryListResponse;
import java.util.List;

@RestController
@RequestMapping("/api/pod")
public class ProofOfDeliveryController {

    private final ProofOfDeliveryService proofOfDeliveryService;

    public ProofOfDeliveryController(ProofOfDeliveryService proofOfDeliveryService) {
        this.proofOfDeliveryService = proofOfDeliveryService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ProofOfDeliveryResponse> createProofOfDelivery(
            @ModelAttribute ProofOfDeliveryRequest request) {

        ProofOfDeliveryResponse response = proofOfDeliveryService.createProofOfDelivery(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{podId}")
    public ResponseEntity<ProofOfDeliveryResponse> getProofOfDelivery(
            @PathVariable Long podId) {

        ProofOfDeliveryResponse response = proofOfDeliveryService.getProofOfDelivery(podId);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{podId}/download/signature")
    public ResponseEntity<byte[]> downloadSignature(
            @PathVariable Long podId) {

        return proofOfDeliveryService.downloadSignature(podId);
    }

    @GetMapping("/{podId}/download/pdf")
    public ResponseEntity<byte[]> downloadPdf(
            @PathVariable Long podId) {

        return proofOfDeliveryService.downloadPdf(podId);
    }

    @GetMapping("/image/download")
    public ResponseEntity<byte[]> downloadImage(
            @RequestParam String url) {

        return proofOfDeliveryService.downloadImage(url);

    }

    @GetMapping("/all")
    public ResponseEntity<List<ProofOfDeliveryListResponse>> getAllProofOfDeliveries() {

        List<ProofOfDeliveryListResponse> response = proofOfDeliveryService.getAllProofOfDeliveries();

        return ResponseEntity.ok(response);
    }
}