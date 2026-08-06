package com.shiptrackpro.service;

import com.shiptrackpro.dto.AnalyticsDashboardResponse;
import com.shiptrackpro.dto.BusinessDashboardResponse;
import com.shiptrackpro.dto.CustomerDashboardResponse;

public interface DashboardService {

    AnalyticsDashboardResponse getAnalyticsDashboard();

    CustomerDashboardResponse getCustomerDashboard();

    BusinessDashboardResponse getBusinessDashboard();
}