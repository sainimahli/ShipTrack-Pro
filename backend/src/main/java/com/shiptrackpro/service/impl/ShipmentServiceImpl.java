package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.CreateShipmentRequest;
import com.shiptrackpro.dto.ShipmentResponse;
import com.shiptrackpro.dto.ShipmentHistoryItem;
import com.shiptrackpro.dto.UpdateShipmentRequest;
import com.shiptrackpro.entity.Address;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.entity.TrackingEvent;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.enums.NotificationChannel;
import com.shiptrackpro.enums.NotificationEventType;
import com.shiptrackpro.enums.ShipmentStatus;
import com.shiptrackpro.enums.AddressType;
import com.shiptrackpro.exception.ResourceNotFoundException;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.repository.AddressRepository;
import com.shiptrackpro.repository.TrackingEventRepository;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.service.NotificationService;
import com.shiptrackpro.service.ShipmentService;
import com.shiptrackpro.service.TrackingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.math.BigDecimal;


import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ShipmentServiceImpl implements ShipmentService {

    private static final String TRACKING_NUMBER_PREFIX = "SHIP-";
    private static final int TRACKING_NUMBER_SUFFIX_LENGTH = 8;

    private final ShipmentRepository shipmentRepository;
    private final AddressRepository addressRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final TrackingService trackingService;

    public ShipmentServiceImpl(
            ShipmentRepository shipmentRepository,
            AddressRepository addressRepository,
            TrackingEventRepository trackingEventRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            TrackingService trackingService) {

        this.shipmentRepository = shipmentRepository;
        this.addressRepository = addressRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.trackingService = trackingService;
    }

    @Override
    @Transactional
    public ShipmentResponse createShipment(CreateShipmentRequest request, Long createdByUserId) {

        User creator = findUserOrThrow(createdByUserId, "creator");

        Long senderAddressId = request.getSenderAddressId() != null
                ? request.getSenderAddressId()
                : createAddress(request.getSenderName(), request.getSenderCity(), null, AddressType.SENDER).getAddressId();
        Long receiverAddressId = request.getReceiverAddressId() != null
                ? request.getReceiverAddressId()
                : createAddress(request.getReceiverName(), request.getReceiverCity(), request.getDeliveryAddress(), AddressType.RECEIVER).getAddressId();
        BigDecimal totalWeight = request.getTotalWeightKg() != null
                ? request.getTotalWeightKg() : parseWeight(request.getWeight());
        if (totalWeight == null || totalWeight.signum() <= 0) {
            throw new IllegalArgumentException("Package weight must be greater than zero");
        }
        String packageType = databaseShipmentType(request.getPriority(), request.getShipmentType());

        Shipment shipment = Shipment.builder()
                .trackingNumber(generateUniqueTrackingNumber())
                .userId(creator.getUserId())
                .senderAddressId(senderAddressId)
                .receiverAddressId(receiverAddressId)
                .originWarehouseId(request.getOriginWarehouseId())
                .destinationWarehouseId(request.getDestinationWarehouseId())
                .assignedDriverId(request.getAssignedDriverId())
                .assignedVehicleId(request.getAssignedVehicleId())
                .shipmentStatus(ShipmentStatus.CREATED)
                .totalWeightKg(totalWeight)
                .shipmentType(packageType)
                .expectedDeliveryDate(request.getEta() != null ? request.getEta() : request.getExpectedDeliveryDate())
                .estimatedArrival(null)
                .actualDeliveryDate(null)
                .distanceRemainingKm(null)
                .forecastConfidence(null)
                .isDelayed(false)
                .delayReason(null)
                .build();

        Shipment saved = shipmentRepository.save(shipment);

        trackingService.recordShipmentCreated(saved.getTrackingNumber());

        notificationService.createNotification(
                creator,
                saved,
                NotificationEventType.SHIPMENT_CREATED,
                NotificationChannel.PUSH,
                "Shipment Created",
                "Shipment " + saved.getTrackingNumber()
                        + " has been created successfully."
        );

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
    @Transactional
    public ShipmentResponse updateShipment(Long id, UpdateShipmentRequest request) {

        Shipment shipment = findShipmentOrThrow(id);

        updateAddress(shipment.getSenderAddressId(), request.getSenderName(), request.getSenderCity(), null, AddressType.SENDER);
        updateAddress(shipment.getReceiverAddressId(), request.getReceiverName(), request.getReceiverCity(), request.getDeliveryAddress(), AddressType.RECEIVER);
        if (request.getSenderAddressId() != null) shipment.setSenderAddressId(request.getSenderAddressId());
        if (request.getReceiverAddressId() != null) shipment.setReceiverAddressId(request.getReceiverAddressId());
        if (request.getOriginWarehouseId() != null) shipment.setOriginWarehouseId(request.getOriginWarehouseId());
        if (request.getDestinationWarehouseId() != null) shipment.setDestinationWarehouseId(request.getDestinationWarehouseId());
        if (request.getAssignedDriverId() != null) shipment.setAssignedDriverId(request.getAssignedDriverId());
        if (request.getAssignedVehicleId() != null) shipment.setAssignedVehicleId(request.getAssignedVehicleId());
        if (request.getTotalWeightKg() != null || request.getWeight() != null) shipment.setTotalWeightKg(
                request.getTotalWeightKg() != null ? request.getTotalWeightKg() : parseWeight(request.getWeight()));
        if (request.getPackageType() != null || request.getShipmentType() != null || request.getPriority() != null) {
            shipment.setShipmentType(databaseShipmentType(request.getPriority(), request.getShipmentType()));
        }
        if (request.getEta() != null || request.getExpectedDeliveryDate() != null) shipment.setExpectedDeliveryDate(
                request.getEta() != null ? request.getEta() : request.getExpectedDeliveryDate());

        Shipment updated = shipmentRepository.save(shipment);

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public ShipmentResponse deleteShipment(Long id) {

        Shipment shipment = findShipmentOrThrow(id);

        shipment.setShipmentStatus(ShipmentStatus.CANCELLED);

        Shipment cancelled = shipmentRepository.save(shipment);

        Address sender = addressRepository.findById(cancelled.getSenderAddressId()).orElse(null);
        TrackingEvent event = new TrackingEvent();
        event.setShipment(cancelled);
        event.setTrackingNumberCache(cancelled.getTrackingNumber());
        event.setStatus(ShipmentStatus.CANCELLED);
        event.setLocationName(sender == null ? null : sender.getCity());
        event.setDescription("Shipment cancelled");
        event.setUpdatedBy("SYSTEM");
        event.setUpdatedAt(OffsetDateTime.now());
        trackingEventRepository.save(event);

        return mapToResponse(cancelled);
    }


    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private Shipment findShipmentOrThrow(Long id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Shipment not found with id: " + id));
    }

    private User findUserOrThrow(Long userId, String role) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found for " + role + " with id: " + userId));
    }

    private ShipmentResponse mapToResponse(Shipment shipment) {
        Address sender = addressRepository.findById(shipment.getSenderAddressId()).orElse(null);
        Address receiver = addressRepository.findById(shipment.getReceiverAddressId()).orElse(null);
        var history = trackingEventRepository.findByTrackingNumberOrderByUpdatedAtAsc(shipment.getTrackingNumber())
                .stream()
                .map(event -> new ShipmentHistoryItem(
                        humanizeStatus(event.getStatus()),
                        firstNonBlank(event.getLocationName(), event.getDescription(), receiver == null ? "" : receiver.getCity()),
                        event.getUpdatedAt()))
                .toList();

        return ShipmentResponse.builder()
                .shipmentId(shipment.getShipmentId())
                .trackingNumber(shipment.getTrackingNumber())
                .userId(shipment.getUserId())
                .senderAddressId(shipment.getSenderAddressId())
                .receiverAddressId(shipment.getReceiverAddressId())
                .originWarehouseId(shipment.getOriginWarehouseId())
                .destinationWarehouseId(shipment.getDestinationWarehouseId())
                .assignedDriverId(shipment.getAssignedDriverId())
                .assignedVehicleId(shipment.getAssignedVehicleId())
                .shipmentStatus(shipment.getShipmentStatus())
                .totalWeightKg(shipment.getTotalWeightKg())
                .shipmentType(shipment.getShipmentType())
                .priority(displayPriority(shipment.getShipmentType()))
                .senderName(sender == null ? "Sender" : sender.getAddressLine1())
                .senderCity(sender == null ? "" : sender.getCity())
                .receiverName(receiver == null ? "Receiver" : firstNonBlank(receiver.getAddressLine2(), receiver.getAddressLine1()))
                .receiverCity(receiver == null ? "" : receiver.getCity())
                .packageType(displayPackageType(shipment.getShipmentType()))
                .weight(shipment.getTotalWeightKg() == null ? "" : shipment.getTotalWeightKg().stripTrailingZeros().toPlainString() + " kg")
                .deliveryAddress(receiver == null ? "" : receiver.getAddressLine1())
                .eta(shipment.getExpectedDeliveryDate())
                .status(humanizeStatus(shipment.getShipmentStatus()))
                .progress(progressFor(shipment.getShipmentStatus()))
                .history(history)
                .expectedDeliveryDate(shipment.getExpectedDeliveryDate())
                .actualDeliveryDate(shipment.getActualDeliveryDate())
                .estimatedArrival(shipment.getEstimatedArrival())
                .distanceRemainingKm(shipment.getDistanceRemainingKm())
                .forecastConfidence(shipment.getForecastConfidence())
                .isDelayed(shipment.getIsDelayed())
                .delayReason(shipment.getDelayReason())
                .createdAt(shipment.getCreatedAt())
                .updatedAt(shipment.getUpdatedAt())
                .build();
    }

    private Address createAddress(String name, String city, String addressLine, AddressType type) {
        Address address = Address.builder()
                .addressType(type)
                .addressLine1(firstNonBlank(addressLine, name, "Address not provided"))
                .addressLine2(type == AddressType.RECEIVER ? name : null)
                .city(firstNonBlank(city, "Not provided"))
                .state("Not provided")
                .postalCode("000000")
                .country("India")
                .build();
        return addressRepository.save(address);
    }

    private void updateAddress(Long id, String name, String city, String addressLine, AddressType type) {
        if (id == null || (name == null && city == null && addressLine == null)) return;
        Address address = addressRepository.findById(id).orElse(null);
        if (address == null) return;
        if (name != null && type == AddressType.SENDER) address.setAddressLine1(name);
        if (name != null && type == AddressType.RECEIVER) address.setAddressLine2(name);
        if (addressLine != null && type == AddressType.RECEIVER) address.setAddressLine1(addressLine);
        if (city != null) address.setCity(city);
        addressRepository.save(address);
    }

    private BigDecimal parseWeight(String weight) {
        if (weight == null || weight.isBlank()) return null;
        String numeric = weight.trim().replaceAll("[^0-9.]", "");
        try { return new BigDecimal(numeric); }
        catch (NumberFormatException ex) { throw new IllegalArgumentException("Package weight must be a number"); }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) if (value != null && !value.isBlank()) return value;
        return null;
    }

    private String humanizeStatus(ShipmentStatus status) {
        return switch (status) {
            case CREATED -> "Created";
            case PICKED_UP -> "Picked Up";
            case IN_TRANSIT -> "In Transit";
            case OUT_FOR_DELIVERY -> "Out for Delivery";
            case DELIVERED -> "Delivered";
            case FAILED_DELIVERY -> "Failed Delivery";
            case CANCELLED -> "Cancelled";
            case RETURNED -> "Returned";
        };
    }

    // The live database constrains shipment_type to these values. Keep the
    // friendly package controls in the UI while persisting a valid transport type.
    private String databaseShipmentType(String priority, String shipmentType) {
        if ("SAME_DAY".equals(shipmentType) || "EXPRESS".equals(shipmentType) || "STANDARD".equals(shipmentType)) return shipmentType;
        if ("Critical".equalsIgnoreCase(priority)) return "SAME_DAY";
        if ("Express".equalsIgnoreCase(priority)) return "EXPRESS";
        return "STANDARD";
    }

    private String displayPackageType(String shipmentType) {
        return switch (shipmentType) {
            case "EXPRESS" -> "Express Cargo";
            case "SAME_DAY" -> "Critical Cargo";
            default -> "General Cargo";
        };
    }

    private String displayPriority(String shipmentType) {
        return switch (shipmentType) {
            case "EXPRESS" -> "Express";
            case "SAME_DAY" -> "Critical";
            default -> "Standard";
        };
    }

    private int progressFor(ShipmentStatus status) {
        return switch (status) {
            case CREATED -> 12; case PICKED_UP -> 28; case IN_TRANSIT -> 58;
            case OUT_FOR_DELIVERY -> 84; case DELIVERED -> 100; case FAILED_DELIVERY -> 72;
            case CANCELLED, RETURNED -> 0;
        };
    }

    private String generateUniqueTrackingNumber() {

        String candidate;

        do {

            String random =
                    UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            .substring(0, TRACKING_NUMBER_SUFFIX_LENGTH)
                            .toUpperCase();

            candidate = TRACKING_NUMBER_PREFIX + random;

        } while (shipmentRepository.existsByTrackingNumber(candidate));

        return candidate;
    }

}

