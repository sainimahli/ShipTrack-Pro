package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.AddressRequest;
import com.shiptrackpro.dto.AddressResponse;
import com.shiptrackpro.dto.CreateShipmentRequest;
import com.shiptrackpro.dto.ShipmentResponse;
import com.shiptrackpro.dto.UpdateShipmentRequest;
import com.shiptrackpro.entity.Address;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.enums.ShipmentStatus;
import com.shiptrackpro.exception.ResourceNotFoundException;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.service.ShipmentService;
import com.shiptrackpro.service.TrackingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Default implementation of {@link ShipmentService}.
 *
 * <p>MODIFIED from the previous version: mapping now handles the
 * {@code Address}/{@code User} relations introduced by the normalized
 * schema, and {@code createdBy} is resolved from the authenticated
 * principal rather than the request body.</p>
 */
@Service
@Transactional
@SuppressWarnings("null")
public class ShipmentServiceImpl implements ShipmentService {

    private static final String TRACKING_NUMBER_PREFIX = "SHIP-";
    private static final int TRACKING_NUMBER_SUFFIX_LENGTH = 8;

    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final TrackingService trackingService;

    /**
     * Constructor injection — preferred over field injection for
     * testability and immutability of dependencies.
     */
    public ShipmentServiceImpl(ShipmentRepository shipmentRepository,
                               UserRepository userRepository,
                               TrackingService trackingService) {
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
        this.trackingService = trackingService;
    }

    @Override
    public ShipmentResponse createShipment(CreateShipmentRequest request, Long createdByUserId) {
        User createdBy = findUserOrThrow(createdByUserId, "creator");

        Shipment shipment = Shipment.builder()
                .trackingNumber(generateUniqueTrackingNumber())
                .senderName(request.getSenderName())
                .senderPhone(request.getSenderPhone())
                .senderUser(resolveOptionalUser(request.getSenderUserId()))
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .receiverUser(resolveOptionalUser(request.getReceiverUserId()))
                .originAddress(toAddressEntity(request.getOriginAddress()))
                .destinationAddress(toAddressEntity(request.getDestinationAddress()))
                .packageWeight(request.getPackageWeight())
                .shipmentType(request.getShipmentType())
                .packageType(request.getPackageType())
                .shipmentStatus(ShipmentStatus.CREATED)
                .expectedDeliveryDate(request.getExpectedDeliveryDate())
                .createdBy(createdBy)
                .build();

        // originAddress/destinationAddress are transient at this point;
        // cascade = {PERSIST, MERGE} on Shipment's associations (see the
        // modified entity) persists them in the same operation.
        Shipment saved = shipmentRepository.save(shipment);
        trackingService.recordShipmentCreated(saved.getTrackingNumber());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShipmentResponse> getAllShipments() {
        return shipmentRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ShipmentResponse getShipmentById(Long id) {
        return mapToResponse(findShipmentOrThrow(id));
    }

    @Override
    public ShipmentResponse updateShipment(Long id, UpdateShipmentRequest request) {
        Shipment shipment = findShipmentOrThrow(id);

        shipment.setSenderName(request.getSenderName());
        shipment.setSenderPhone(request.getSenderPhone());
        shipment.setSenderUser(resolveOptionalUser(request.getSenderUserId()));
        shipment.setReceiverName(request.getReceiverName());
        shipment.setReceiverPhone(request.getReceiverPhone());
        shipment.setReceiverUser(resolveOptionalUser(request.getReceiverUserId()));
        shipment.setPackageWeight(request.getPackageWeight());
        shipment.setShipmentType(request.getShipmentType());
        shipment.setPackageType(request.getPackageType());
        shipment.setExpectedDeliveryDate(request.getExpectedDeliveryDate());

        // Update the existing Address rows in place rather than replacing
        // the association — avoids creating orphaned address records on
        // every edit. Managed-entity field changes are flushed by JPA
        // dirty checking; the explicit save() below is just for clarity.
        copyAddressFields(shipment.getOriginAddress(), request.getOriginAddress());
        copyAddressFields(shipment.getDestinationAddress(), request.getDestinationAddress());

        // id, trackingNumber, shipmentStatus, createdBy, createdAt are
        // intentionally left untouched — system-managed / immutable via
        // this endpoint.
        Shipment updated = shipmentRepository.save(shipment);
        return mapToResponse(updated);
    }

    @Override
    public ShipmentResponse deleteShipment(Long id) {
        Shipment shipment = findShipmentOrThrow(id);

        // Soft-cancel rather than a hard delete: shipment history is
        // valuable for tracking, analytics, and customer support, so the
        // record is preserved with a terminal CANCELLED status instead of
        // being removed from the database. If a genuine hard delete is
        // ever required, replace this with shipmentRepository.delete(shipment).
        shipment.setShipmentStatus(ShipmentStatus.CANCELLED);

        Shipment cancelled = shipmentRepository.save(shipment);
        return mapToResponse(cancelled);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private Shipment findShipmentOrThrow(Long id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Shipment not found with id: " + id));
    }

    private User findUserOrThrow(Long userId, String roleDescription) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found for " + roleDescription + " with id: " + userId));
    }

    /** Returns null if userId is null, otherwise resolves the user or throws. */
    private User resolveOptionalUser(Long userId) {
        if (userId == null) {
            return null;
        }
        return findUserOrThrow(userId, "sender/receiver");
    }

    private Address toAddressEntity(AddressRequest request) {
        return Address.builder()
                .line1(request.getLine1())
                .line2(request.getLine2())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .country(request.getCountry())
                .build();
    }

    private void copyAddressFields(Address target, AddressRequest source) {
        target.setLine1(source.getLine1());
        target.setLine2(source.getLine2());
        target.setCity(source.getCity());
        target.setState(source.getState());
        target.setPostalCode(source.getPostalCode());
        target.setCountry(source.getCountry());
    }

    private AddressResponse mapAddress(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .line1(address.getLine1())
                .line2(address.getLine2())
                .city(address.getCity())
                .state(address.getState())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .build();
    }

    private ShipmentResponse mapToResponse(Shipment shipment) {
        return ShipmentResponse.builder()
                .id(shipment.getId())
                .trackingNumber(shipment.getTrackingNumber())
                .senderName(shipment.getSenderName())
                .senderPhone(shipment.getSenderPhone())
                .senderUserId(shipment.getSenderUser() != null ? shipment.getSenderUser().getUserId() : null)
                .receiverName(shipment.getReceiverName())
                .receiverPhone(shipment.getReceiverPhone())
                .receiverUserId(shipment.getReceiverUser() != null ? shipment.getReceiverUser().getUserId() : null)
                .originAddress(mapAddress(shipment.getOriginAddress()))
                .destinationAddress(mapAddress(shipment.getDestinationAddress()))
                .packageWeight(shipment.getPackageWeight())
                .shipmentType(shipment.getShipmentType())
                .packageType(shipment.getPackageType())
                .shipmentStatus(shipment.getShipmentStatus())
                .expectedDeliveryDate(shipment.getExpectedDeliveryDate())
                .createdByUserId(shipment.getCreatedBy().getUserId())
                .createdAt(shipment.getCreatedAt())
                .updatedAt(shipment.getUpdatedAt())
                .build();
    }

    private String generateUniqueTrackingNumber() {
        String candidate;
        do {
            String randomSegment = UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, TRACKING_NUMBER_SUFFIX_LENGTH)
                    .toUpperCase();
            candidate = TRACKING_NUMBER_PREFIX + randomSegment;
        } while (shipmentRepository.existsByTrackingNumber(candidate));

        return candidate;
    }

}

