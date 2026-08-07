package com.shiptrackpro.controller;

import com.shiptrackpro.dto.DriverLocationRequest;
import com.shiptrackpro.service.DriverLocationService;
import com.shiptrackpro.dto.DriverLocationResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/drivers")
public class DriverLocationController {

    private final DriverLocationService driverLocationService;

    public DriverLocationController(DriverLocationService driverLocationService) {
        this.driverLocationService = driverLocationService;
    }

    @PostMapping("/{driverId}/location")
    public ResponseEntity<DriverLocationResponse> saveLocation(
            @PathVariable Long driverId,
            @Valid @RequestBody DriverLocationRequest request) {
        DriverLocationResponse response = driverLocationService.saveLocation(driverId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{driverId}/location")
    public ResponseEntity<DriverLocationResponse> getLatestLocation(@PathVariable Long driverId) {
        return ResponseEntity.ok(driverLocationService.getLatestLocation(driverId));
    }

}
