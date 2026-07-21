package com.shiptrackpro.controller;

import com.shiptrackpro.dto.ETAResponse;
import com.shiptrackpro.service.ETAService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/eta")
@RequiredArgsConstructor
public class ETAController {

    private final ETAService etaService;

    @GetMapping("/{trackingNumber}")
    public ResponseEntity<ETAResponse> getETA(
            @PathVariable String trackingNumber) {

        return ResponseEntity.ok(
                etaService.getETA(trackingNumber)
        );
    }
}