package com.shiptrackpro.service;

import com.shiptrackpro.dto.AlertRequest;
import com.shiptrackpro.dto.AlertResponse;

import java.util.List;

public interface AlertService {

    AlertResponse createAlert(Long shipmentId, AlertRequest request);

    List<AlertResponse> getAlertsByShipment(Long shipmentId);

    AlertResponse markAsRead(Long alertId);

    /**
     * Evaluates a delay risk level and raises an alert if warranted
     * (HIGH or MEDIUM), skipping creation if an unread alert already
     * exists for this shipment to avoid duplicates.
     *
     * Call this from your existing delay prediction flow (see
     * DelayPredictionController/Service) after computing a prediction -
     * I don't have that file's current content, so I can't wire this in
     * for you directly.
     *
     * @return the created alert, or null if no alert was raised
     */
    AlertResponse evaluateAndRaiseAlertIfNeeded(Long shipmentId, String delayRisk, String message);

}
