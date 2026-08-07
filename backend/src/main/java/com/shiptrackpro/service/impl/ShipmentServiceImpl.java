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
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final TrackingService trackingService;
    private final TrackingEventRepository trackingEventRepository;

    public ShipmentServiceImpl(
            ShipmentRepository shipmentRepository,
            AddressRepository addressRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            TrackingService trackingService, TrackingEventRepository trackingEventRepository) {

        this.shipmentRepository = shipmentRepository;
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.trackingService = trackingService;
        this.trackingEventRepository = trackingEventRepository;
    }

    @Override
    @Transactional
    public ShipmentResponse createShipment(CreateShipmentRequest request, Long createdByUserId) {

        User creator = findUserOrThrow(createdByUserId, "creator");

        Long senderAddressId = request.getSenderAddressId();
        if (senderAddressId == null && request.getSenderCity() != null) {
            Address senderAddr = Address.builder()
                    .addressType(AddressType.SENDER)
                    .city(request.getSenderCity())
                    .addressLine1(request.getSenderCity())
                    .state("N/A")
                    .postalCode("000000")
                    .country("India")
                    .build();
            senderAddressId = addressRepository.save(senderAddr).getAddressId();
        }

        Long receiverAddressId = request.getReceiverAddressId();
        if (receiverAddressId == null && request.getReceiverCity() != null) {
            Address receiverAddr = Address.builder()
                    .addressType(AddressType.RECEIVER)
                    .city(request.getReceiverCity())
                    .addressLine1(request.getDeliveryAddress() != null ? request.getDeliveryAddress() : request.getReceiverCity())
                    .state("N/A")
                    .postalCode("000000")
                    .country("India")
                    .build();
            receiverAddressId = addressRepository.save(receiverAddr).getAddressId();
        }

        if (senderAddressId == null || receiverAddressId == null) {
            throw new IllegalArgumentException("Sender address ID and receiver address ID (or city details) are required");
        }

        BigDecimal totalWeight = request.getTotalWeightKg();
        if (totalWeight == null && request.getWeight() != null) {
            try {
                totalWeight = new BigDecimal(request.getWeight().replaceAll("[^0-9.]", ""));
            } catch (Exception ignored) {}
        }
        if (totalWeight == null || totalWeight.compareTo(BigDecimal.ZERO) <= 0) {
            totalWeight = new BigDecimal("1.0");
        }

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
                .shipmentType(request.getShipmentType() != null ? request.getShipmentType() : "STANDARD")
                .packageType(request.getPackageType() != null ? request.getPackageType() : "General Cargo")
                .receiverName(request.getReceiverName())
                .expectedDeliveryDate(request.getExpectedDeliveryDate())
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
        return shipmentRepository.findAllWithLatestLocation()
                .stream()
                .map(dto -> mapToResponse(dto.getShipment(), dto.getLatitude(), dto.getLongitude()))
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

        shipment.setSenderAddressId(request.getSenderAddressId());
        shipment.setReceiverAddressId(request.getReceiverAddressId());
        shipment.setOriginWarehouseId(request.getOriginWarehouseId());
        shipment.setDestinationWarehouseId(request.getDestinationWarehouseId());
        shipment.setAssignedDriverId(request.getAssignedDriverId());
        shipment.setAssignedVehicleId(request.getAssignedVehicleId());
        shipment.setTotalWeightKg(request.getTotalWeightKg());
        shipment.setShipmentType(request.getShipmentType());
        if (request.getPackageType() != null) {
            shipment.setPackageType(request.getPackageType());
        }
        shipment.setExpectedDeliveryDate(request.getExpectedDeliveryDate());

        updateAddress(shipment.getSenderAddressId(), request.getSenderCity(), null);
        updateAddress(shipment.getReceiverAddressId(), request.getReceiverCity(), request.getDeliveryAddress());

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
        return mapToResponse(shipment, null, null);
    }

    private ShipmentResponse mapToResponse(Shipment shipment, Double latitude, Double longitude) {

        Address senderAddress = shipment.getSenderAddressId() == null
                ? null
                : addressRepository.findById(shipment.getSenderAddressId()).orElse(null);

        Address receiverAddress = shipment.getReceiverAddressId() == null
                ? null
                : addressRepository.findById(shipment.getReceiverAddressId()).orElse(null);

        User sender = shipment.getUserId() == null
                ? null
                : userRepository.findById(shipment.getUserId()).orElse(null);

        String senderName = null;

        if (sender != null) {
            senderName = sender.getFirstName();

            if (sender.getLastName() != null && !sender.getLastName().isBlank()) {
                senderName = senderName + " " + sender.getLastName();
            }
        }

        return ShipmentResponse.builder()
                .shipmentId(shipment.getShipmentId())
                .trackingNumber(shipment.getTrackingNumber())
                .userId(shipment.getUserId())

                .senderAddressId(shipment.getSenderAddressId())
                .receiverAddressId(shipment.getReceiverAddressId())

                // Names
                .senderName(senderName)
                .receiverName(shipment.getReceiverName())

                // Address details
                .senderCity(senderAddress == null ? null : senderAddress.getCity())
                .receiverCity(receiverAddress == null ? null : receiverAddress.getCity())
                .deliveryAddress(receiverAddress == null ? null : receiverAddress.getAddressLine1())

                .originWarehouseId(shipment.getOriginWarehouseId())
                .destinationWarehouseId(shipment.getDestinationWarehouseId())

                .assignedDriverId(shipment.getAssignedDriverId())
                .assignedVehicleId(shipment.getAssignedVehicleId())

                .shipmentStatus(shipment.getShipmentStatus())

                .totalWeightKg(shipment.getTotalWeightKg())

                .shipmentType(shipment.getShipmentType())
                .packageType(shipment.getPackageType())

                .expectedDeliveryDate(shipment.getExpectedDeliveryDate())
                .actualDeliveryDate(shipment.getActualDeliveryDate())
                .estimatedArrival(shipment.getEstimatedArrival())

                .distanceRemainingKm(shipment.getDistanceRemainingKm())

                .forecastConfidence(shipment.getForecastConfidence())

                .isDelayed(shipment.getIsDelayed())
                .delayReason(shipment.getDelayReason())

                .currentLatitude(latitude)
                .currentLongitude(longitude)

                .createdAt(shipment.getCreatedAt())
                .updatedAt(shipment.getUpdatedAt())

                .build();
    }

    private void updateAddress(Long addressId, String city, String addressLine1) {
        if (addressId == null || ((city == null || city.isBlank())
                && (addressLine1 == null || addressLine1.isBlank()))) {
            return;
        }

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));
        if (city != null && !city.isBlank()) {
            address.setCity(city.trim());
        }
        if (addressLine1 != null && !addressLine1.isBlank()) {
            address.setAddressLine1(addressLine1.trim());
        }
        addressRepository.save(address);
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

