package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.ShipmentRequest;
import com.shiptrackpro.dto.ShipmentResponse;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.enums.ShipmentStatus;
import com.shiptrackpro.service.ShipmentService;
import com.shiptrackpro.exception.ResourceNotFoundException;
import com.shiptrackpro.repository.ShipmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Default implementation of {@link ShipmentService}.
 *
 * <p>Handles tracking-number generation, default status assignment, and
 * entity/DTO mapping on top of {@link ShipmentRepository}.</p>
 */
@Service
@Transactional
public class ShipmentServiceImpl implements ShipmentService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final ShipmentRepository shipmentRepository;

    /**
     * Constructor injection — preferred over field injection for
     * testability and immutability of dependencies.
     */
    public ShipmentServiceImpl(ShipmentRepository shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }

    @Override
    public ShipmentResponse createShipment(ShipmentRequest request) {
        Shipment shipment = Shipment.builder()
                .trackingNumber(generateUniqueTrackingNumber())
                .senderName(request.getSenderName())
                .senderPhone(request.getSenderPhone())
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .packageType(request.getPackageType())
                .packageWeight(request.getPackageWeight())
                .origin(request.getOrigin())
                .destination(request.getDestination())
                .deliveryAddress(request.getDeliveryAddress())
                .shipmentStatus(ShipmentStatus.CREATED)
                .build();

        Shipment saved = shipmentRepository.save(shipment);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShipmentResponse> getAllShipments() {
        return shipmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentResponse getShipmentById(Long id) {
        Shipment shipment = findShipmentOrThrow(id);
        return toResponse(shipment);
    }

    @Override
    public ShipmentResponse updateShipment(Long id, ShipmentRequest request) {
        Shipment shipment = findShipmentOrThrow(id);

        // Only mutable, client-editable fields are updated here.
        // trackingNumber, id, shipmentStatus, createdAt, and updatedAt are
        // system-managed and intentionally left untouched by this method.
        shipment.setSenderName(request.getSenderName());
        shipment.setSenderPhone(request.getSenderPhone());
        shipment.setReceiverName(request.getReceiverName());
        shipment.setReceiverPhone(request.getReceiverPhone());
        shipment.setPackageType(request.getPackageType());
        shipment.setPackageWeight(request.getPackageWeight());
        shipment.setOrigin(request.getOrigin());
        shipment.setDestination(request.getDestination());
        shipment.setDeliveryAddress(request.getDeliveryAddress());

        Shipment updated = shipmentRepository.save(shipment);
        return toResponse(updated);
    }

    @Override
    public ShipmentResponse cancelShipment(Long id) {
        Shipment shipment = findShipmentOrThrow(id);

        // Soft-cancel rather than a hard delete: shipment history is
        // valuable for tracking, analytics, and customer support, so the
        // record is preserved with a terminal CANCELLED status instead of
        // being removed from the database.
        shipment.setShipmentStatus(ShipmentStatus.CANCELLED);

        Shipment cancelled = shipmentRepository.save(shipment);
        return toResponse(cancelled);
    }

    /**
     * Fetches a shipment by id or throws {@link ResourceNotFoundException}.
     * Centralizes the "not found" lookup so it isn't repeated in every
     * public method.
     */
    private Shipment findShipmentOrThrow(Long id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Shipment not found with id: " + id));
    }

    /**
     * Generates a tracking number in the form {@code STP-yyyyMMdd-XXXXXXXX},
     * where the suffix is derived from a random UUID. Collisions are
     * astronomically unlikely given the UUID entropy, but if your
     * repository exposes a {@code existsByTrackingNumber} method, wrap this
     * in a retry loop for a hard uniqueness guarantee.
     */
    private String generateUniqueTrackingNumber() {
        String datePart = LocalDate.now().format(DATE_FORMAT);
        String randomPart = UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();
        return "STP-" + datePart + "-" + randomPart;
    }

    /**
     * Maps a {@link Shipment} entity to its outward-facing
     * {@link ShipmentResponse} DTO.
     */
    private ShipmentResponse toResponse(Shipment shipment) {
        return ShipmentResponse.builder()
                .id(shipment.getId())
                .trackingNumber(shipment.getTrackingNumber())
                .senderName(shipment.getSenderName())
                .senderPhone(shipment.getSenderPhone())
                .receiverName(shipment.getReceiverName())
                .receiverPhone(shipment.getReceiverPhone())
                .packageType(shipment.getPackageType())
                .packageWeight(shipment.getPackageWeight())
                .origin(shipment.getOrigin())
                .destination(shipment.getDestination())
                .deliveryAddress(shipment.getDeliveryAddress())
                .shipmentStatus(shipment.getShipmentStatus())
                .createdAt(shipment.getCreatedAt())
                .updatedAt(shipment.getUpdatedAt())
                .build();
    }

}
