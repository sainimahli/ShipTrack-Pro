package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.DeliveryConfirmationRequest;
import com.shiptrackpro.dto.DeliveryConfirmationResponse;
import com.shiptrackpro.entity.DeliveryConfirmation;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.enums.ShipmentStatus;
import com.shiptrackpro.exception.ResourceNotFoundException;
import com.shiptrackpro.repository.DeliveryConfirmationRepository;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.service.DeliveryConfirmationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * ASSUMES: Shipment's primary key getter is getId() and its status
 * field/setter is setShipmentStatus(ShipmentStatus) - matching the
 * Shipment entity from earlier in this project. If either differs in
 * your actual entity, those are the two lines to adjust.
 */
@Service
@Transactional
public class DeliveryConfirmationServiceImpl implements DeliveryConfirmationService {

    private final DeliveryConfirmationRepository deliveryConfirmationRepository;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;

    public DeliveryConfirmationServiceImpl(DeliveryConfirmationRepository deliveryConfirmationRepository,
                                           ShipmentRepository shipmentRepository,
                                           UserRepository userRepository) {
        this.deliveryConfirmationRepository = deliveryConfirmationRepository;
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
    }

    @Override
    public DeliveryConfirmationResponse confirmDelivery(Long shipmentId, DeliveryConfirmationRequest request,
                                                        Long confirmedByUserId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with id: " + shipmentId));

        if (deliveryConfirmationRepository.existsByShipment_ShipmentId(shipmentId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Shipment " + shipmentId + " has already had its delivery confirmed.");
        }

        User confirmedBy = null;
        if (confirmedByUserId != null) {
            confirmedBy = userRepository.findById(confirmedByUserId).orElse(null);
        }

        DeliveryConfirmation confirmation = new DeliveryConfirmation();
        confirmation.setShipment(shipment);
        confirmation.setReceiverName(request.getReceiverName());
        confirmation.setRemarks(request.getRemarks());
        confirmation.setConfirmedBy(confirmedBy);

        DeliveryConfirmation saved = deliveryConfirmationRepository.save(confirmation);

        // Update shipment status to DELIVERED.
        shipment.setShipmentStatus(ShipmentStatus.DELIVERED);
        shipmentRepository.save(shipment);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DeliveryConfirmationResponse getConfirmation(Long shipmentId) {
        // Confirms the shipment itself exists, so a bad shipmentId
        // returns a clear "shipment not found" rather than a confusing
        // "confirmation not found" for an id that was never valid.
        if (!shipmentRepository.existsById(shipmentId)) {
            throw new ResourceNotFoundException("Shipment not found with id: " + shipmentId);
        }

        DeliveryConfirmation confirmation = deliveryConfirmationRepository.findByShipment_ShipmentId(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No delivery confirmation found for shipment with id: " + shipmentId));

        return mapToResponse(confirmation);
    }

    private DeliveryConfirmationResponse mapToResponse(DeliveryConfirmation confirmation) {
        User confirmedBy = confirmation.getConfirmedBy();
        return new DeliveryConfirmationResponse(
                confirmation.getId(),
                confirmation.getShipment().getShipmentId(),
                confirmation.getReceiverName(),
                confirmation.getRemarks(),
                confirmation.getConfirmedAt(),
                confirmedBy != null ? confirmedBy.getUserId() : null,
                confirmedBy != null ? confirmedBy.getFullName() : null
        );
    }

}
