package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.AnalyticsDashboardResponse;
import com.shiptrackpro.enums.ShipmentStatus;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.service.DashboardService;
import org.springframework.stereotype.Service;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final ShipmentRepository shipmentRepository;

    public DashboardServiceImpl(ShipmentRepository shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }

    @Override
    public AnalyticsDashboardResponse getAnalyticsDashboard() {

        long totalShipments = shipmentRepository.count();

        long pendingShipments =
                shipmentRepository.countByShipmentStatus(ShipmentStatus.CREATED)
                        + shipmentRepository.countByShipmentStatus(ShipmentStatus.PICKED_UP)
                        + shipmentRepository.countByShipmentStatus(ShipmentStatus.IN_TRANSIT)
                        + shipmentRepository.countByShipmentStatus(ShipmentStatus.OUT_FOR_DELIVERY);

        long failedShipments =
                shipmentRepository.countByShipmentStatus(ShipmentStatus.FAILED_DELIVERY);

        long successfulShipments =
                shipmentRepository.countByShipmentStatus(ShipmentStatus.DELIVERED);

        return AnalyticsDashboardResponse.builder()
                .totalShipments(totalShipments)
                .pendingShipments(pendingShipments)
                .failedShipments(failedShipments)
                .successfulShipments(successfulShipments)
                .build();
    }
}