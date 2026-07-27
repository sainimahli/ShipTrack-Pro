package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.ForecastResponse;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.enums.ShipmentStatus;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.service.ForecastService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ForecastServiceImpl implements ForecastService {

    private final ShipmentRepository shipmentRepository;

    public ForecastServiceImpl(ShipmentRepository shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }

    @Override
    public ForecastResponse getForecast(Long shipmentId) {

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));

        ShipmentStatus status = shipment.getShipmentStatus();

        LocalDateTime estimatedDelivery;
        int confidence;
        String message;

        switch (status) {

            case CREATED:
                estimatedDelivery = LocalDateTime.now().plusDays(5);
                confidence = 60;
                message = "Shipment created. Estimated delivery generated.";
                break;

            case PICKED_UP:
                estimatedDelivery = LocalDateTime.now().plusDays(4);
                confidence = 75;
                message = "Shipment picked up. Delivery is on schedule.";
                break;

            case IN_TRANSIT:
                estimatedDelivery = LocalDateTime.now().plusDays(2);
                confidence = 85;
                message = "Shipment is currently in transit.";
                break;

            case OUT_FOR_DELIVERY:
                estimatedDelivery = LocalDateTime.now().plusHours(6);
                confidence = 95;
                message = "Shipment is out for delivery.";
                break;

            case DELIVERED:
                estimatedDelivery = shipment.getExpectedDeliveryDate().atStartOfDay();
                confidence = 100;
                message = "Shipment delivered.";
                break;

            case CANCELLED:
                estimatedDelivery = null;
                confidence = 0;
                message = "Shipment has been cancelled.";
                break;

            default:
                estimatedDelivery = LocalDateTime.now().plusDays(5);
                confidence = 50;
                message = "Forecast unavailable.";
        }

        return new ForecastResponse(
                estimatedDelivery,
                confidence,
                message
        );
    }
}