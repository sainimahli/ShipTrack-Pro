package com.shiptrackpro.service;

import com.shiptrackpro.dto.ShipmentResponse;

public interface DriverAssignmentService {

    /**
     * @throws com.shiptrackpro.exception.ResourceNotFoundException if the shipment doesn't exist
     */
    ShipmentResponse assignDriver(Long shipmentId, Long driverId);

    /**
     * @throws com.shiptrackpro.exception.ResourceNotFoundException if the shipment doesn't exist
     */
    ShipmentResponse assignVehicle(Long shipmentId, Long vehicleId);

}
