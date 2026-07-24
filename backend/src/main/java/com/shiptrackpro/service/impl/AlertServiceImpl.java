package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.AlertRequest;
import com.shiptrackpro.dto.AlertResponse;
import com.shiptrackpro.entity.Alert;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.exception.ResourceNotFoundException;
import com.shiptrackpro.repository.AlertRepository;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.service.AlertService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@Transactional
public class AlertServiceImpl implements AlertService {

    private static final Set<String> ALERT_WORTHY_RISK_LEVELS = Set.of("HIGH", "MEDIUM");

    private final AlertRepository alertRepository;
    private final ShipmentRepository shipmentRepository;

    public AlertServiceImpl(AlertRepository alertRepository, ShipmentRepository shipmentRepository) {
        this.alertRepository = alertRepository;
        this.shipmentRepository = shipmentRepository;
    }

    @Override
    public AlertResponse createAlert(Long shipmentId, AlertRequest request) {
        Shipment shipment = findShipmentOrThrow(shipmentId);

        Alert alert = new Alert();
        alert.setShipment(shipment);
        alert.setMessage(request.getMessage());
        alert.setAlertType(request.getAlertType());
        alert.setRead(false);

        return mapToResponse(alertRepository.save(alert));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertResponse> getAlertsByShipment(Long shipmentId) {
        // Confirms the shipment exists before querying, so a bad id
        // returns 404 rather than a silently empty list.
        findShipmentOrThrow(shipmentId);

        return alertRepository.findByShipment_ShipmentIdOrderByCreatedAtDesc(shipmentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public AlertResponse markAsRead(Long alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + alertId));
        alert.setRead(true);
        return mapToResponse(alertRepository.save(alert));
    }

    @Override
    public AlertResponse evaluateAndRaiseAlertIfNeeded(Long shipmentId, String delayRisk, String message) {
        if (delayRisk == null || !ALERT_WORTHY_RISK_LEVELS.contains(delayRisk.toUpperCase())) {
            return null;
        }

        String alertType = "DELAY_" + delayRisk.toUpperCase();

        // A tracking page refreshes repeatedly. Do not create the same alert
        // again after it has been read; a new risk level can still raise a new alert.
        if (alertRepository.findFirstByShipment_ShipmentIdAndAlertType(shipmentId, alertType).isPresent()) {
            return null;
        }

        Shipment shipment = findShipmentOrThrow(shipmentId);

        Alert alert = new Alert();
        alert.setShipment(shipment);
        alert.setAlertType(alertType);
        alert.setMessage(message != null ? message : "Delay risk is " + delayRisk.toUpperCase() + " for this shipment.");
        alert.setRead(false);

        return mapToResponse(alertRepository.save(alert));
    }

    private Shipment findShipmentOrThrow(Long shipmentId) {
        return shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with id: " + shipmentId));
    }

    private AlertResponse mapToResponse(Alert alert) {
        return new AlertResponse(
                alert.getId(),
                alert.getShipment().getShipmentId(),
                alert.getMessage(),
                alert.getAlertType(),
                alert.isRead(),
                alert.getCreatedAt()
        );
    }

}
