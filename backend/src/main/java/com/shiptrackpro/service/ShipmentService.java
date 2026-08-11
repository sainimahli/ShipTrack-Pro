package com.shiptrackpro.service;

import java.util.List;

import com.shiptrackpro.dto.CreateShipmentRequest;
import com.shiptrackpro.dto.ShipmentResponse;
import com.shiptrackpro.dto.UpdateShipmentRequest;

/**
 * Business operations for managing shipments.
 *
 * <p>MODIFIED: {@code createShipment} now takes the authenticated user's id
 * separately from the request body (see {@code createdBy} note on
 * {@link CreateShipmentRequest}); the single {@code ShipmentRequest} type
 * from the previous version is replaced by
 * {@link CreateShipmentRequest}/{@link UpdateShipmentRequest}.</p>
 */
public interface ShipmentService {

    /**
     * Creates a new shipment with an auto-generated tracking number and a
     * default status of {@code CREATED}.
     *
     * @param request         validated shipment details from the client
     * @param createdByUserId id of the authenticated user creating the shipment
     * @return the created shipment
     */
    ShipmentResponse createShipment(CreateShipmentRequest request, Long createdByUserId);

    /**
     * Retrieves all shipments.
     */
    List<ShipmentResponse> getAllShipments();

    /**
     * Retrieves a single shipment by its primary key.
     *
     * @throws com.shiptrackpro.exception.ResourceNotFoundException if no shipment exists with the given id
     */
    ShipmentResponse getShipmentById(Long id);

    /**
     * Updates the mutable details of an existing shipment.
     *
     * @throws com.shiptrackpro.exception.ResourceNotFoundException if no shipment exists with the given id
     */
    ShipmentResponse updateShipment(Long id, UpdateShipmentRequest request);

    /**
     * Removes a shipment from active operation. Implemented as a
     * soft-cancel (status set to {@code CANCELLED}) rather than a physical
     * delete, to preserve tracking history — see
     * {@code ShipmentServiceImpl.deleteShipment} for the rationale.
     *
     * @throws com.shiptrackpro.exception.ResourceNotFoundException if no shipment exists with the given id
     */
    ShipmentResponse deleteShipment(Long id);
    

}