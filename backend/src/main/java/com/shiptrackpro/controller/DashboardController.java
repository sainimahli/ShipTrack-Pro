package com.shiptrackpro.controller;

import com.shiptrackpro.dto.AnalyticsDashboardResponse;
import com.shiptrackpro.dto.BusinessDashboardResponse;
import com.shiptrackpro.dto.CustomerDashboardResponse;
import com.shiptrackpro.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * Customer Dashboard
     */
    @GetMapping("/api/dashboard/customer")
    public ResponseEntity<CustomerDashboardResponse> getCustomerDashboard() {
        return ResponseEntity.ok(
                dashboardService.getCustomerDashboard()
        );
    }

    /**
     * Business Client Dashboard
     */
    @GetMapping("/api/dashboard/business")
    public ResponseEntity<BusinessDashboardResponse> getBusinessDashboard() {
        return ResponseEntity.ok(
                dashboardService.getBusinessDashboard()
        );
    }

    /**
     * Admin Dashboard
     */
    @GetMapping("/api/admin/dashboard/analytics")
    public ResponseEntity<AnalyticsDashboardResponse> getAnalyticsDashboard() {
        return ResponseEntity.ok(
                dashboardService.getAnalyticsDashboard()
        );
    }
}