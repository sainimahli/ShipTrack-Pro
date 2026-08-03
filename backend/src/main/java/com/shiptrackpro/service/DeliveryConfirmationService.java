package com.shiptrackpro.service;

import com.shiptrackpro.dto.DeliveryConfirmationRequest;
import com.shiptrackpro.dto.DeliveryConfirmationResponse;

public interface DeliveryConfirmationService {

    /**
     * Confirms delivery for a shipment: saves receiver name/remarks,
     * stamps confirmedAt, updates the shipment's status to DELIVERED,
     * and records who confirmed it if known.
     *
     * @param shipmentId        the shipment being confirmed
     * @param request           receiver name and optional remarks
     * @param confirmedByUserId id of the authenticated user confirming, or null if unknown
     * @throws com.shiptrackpro.exception.ResourceNotFoundException if the shipment doesn't exist
     * @throws org.springframework.web.server.ResponseStatusException 409 if already confirmed
     */
    DeliveryConfirmationResponse confirmDelivery(Long shipmentId, DeliveryConfirmationRequest request, Long confirmedByUserId);

    /**
     * @throws com.shiptrackpro.exception.ResourceNotFoundException if the shipment doesn't exist, or has no confirmation yet
     */
    DeliveryConfirmationResponse getConfirmation(Long shipmentId);

}
