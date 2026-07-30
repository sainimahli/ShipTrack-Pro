package com.shiptrackpro.controller;

import com.shiptrackpro.dto.AnalyticsDashboardResponse;
import com.shiptrackpro.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsDashboardResponse> getAnalyticsDashboard() {
        return ResponseEntity.ok(dashboardService.getAnalyticsDashboard());
    }
}