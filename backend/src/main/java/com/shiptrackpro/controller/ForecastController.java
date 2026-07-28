package com.shiptrackpro.controller;

import com.shiptrackpro.dto.ForecastResponse;
import com.shiptrackpro.service.ForecastService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/forecast")
public class ForecastController {


    private final ForecastService forecastService;


    public ForecastController(ForecastService forecastService) {
        this.forecastService = forecastService;
    }


    @GetMapping("/{shipmentId}")
    public ResponseEntity<ForecastResponse> getForecast(
            @PathVariable Long shipmentId) {


        ForecastResponse response =
                forecastService.getForecast(shipmentId);


        return ResponseEntity.ok(response);
    }
}