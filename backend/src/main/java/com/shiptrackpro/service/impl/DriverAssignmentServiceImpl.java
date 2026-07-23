package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.ShipmentResponse;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.exception.ResourceNotFoundException;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.service.DriverAssignmentService;
import com.shiptrackpro.service.ShipmentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Deliberately does NOT build ShipmentResponse itself - I don't have your
 * current ShipmentResponse.java, so guessing its full field list (nested
 * addresses, sender/receiver, etc.) risks getting the mapping wrong.
 * Instead, after updating the entity directly via ShipmentRepository,
 * this delegates to your existing ShipmentService.getShipmentById(id) to
 * reuse whatever mapping logic is already correct there.
 *
 * ASSUMPTION: Shipment has getAssignedDriverId()/setAssignedDriverId(Long)
 * and getAssignedVehicleId()/setAssignedVehicleId(Long) - matching the
 * field names you gave me exactly. If Driver/Vehicle entities exist and
 * you want FK-level validation (not just "does this id look valid"), see
 * the commented block below for where to add it.
 */
@Service
@Transactional
public class DriverAssignmentServiceImpl implements DriverAssignmentService {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentService shipmentService;

    public DriverAssignmentServiceImpl(ShipmentRepository shipmentRepository,
                                        ShipmentService shipmentService) {
        this.shipmentRepository = shipmentRepository;
        this.shipmentService = shipmentService;
    }

    @Override
    public ShipmentResponse assignDriver(Long shipmentId, Long driverId) {
        Shipment shipment = findShipmentOrThrow(shipmentId);

        // If you have a DriverRepository, validate existence first:
        // if (!driverRepository.existsById(driverId)) {
        //     throw new ResourceNotFoundException("Driver not found with id: " + driverId);
        // }

        shipment.setAssignedDriverId(driverId);
        shipmentRepository.save(shipment);

        return shipmentService.getShipmentById(shipmentId);
    }

    @Override
    public ShipmentResponse assignVehicle(Long shipmentId, Long vehicleId) {
        Shipment shipment = findShipmentOrThrow(shipmentId);

        // If you have a VehicleRepository, validate existence first:
        // if (!vehicleRepository.existsById(vehicleId)) {
        //     throw new ResourceNotFoundException("Vehicle not found with id: " + vehicleId);
        // }

        shipment.setAssignedVehicleId(vehicleId);
        shipmentRepository.save(shipment);

        return shipmentService.getShipmentById(shipmentId);
    }

    private Shipment findShipmentOrThrow(Long shipmentId) {
        return shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found with id: " + shipmentId));
    }

}
