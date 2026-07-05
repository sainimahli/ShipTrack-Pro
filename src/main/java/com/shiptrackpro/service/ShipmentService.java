package com.shiptrackpro.service;

import com.shiptrackpro.dto.ShipmentRequest;
import com.shiptrackpro.dto.ShipmentResponse;

import java.util.List;

public interface ShipmentService {

    ShipmentResponse createShipment(ShipmentRequest request);

    List<ShipmentResponse> getAllShipments();

    ShipmentResponse getShipmentById(Long id);

    ShipmentResponse updateShipment(Long id, ShipmentRequest request);

    ShipmentResponse cancelShipment(Long id);
}
