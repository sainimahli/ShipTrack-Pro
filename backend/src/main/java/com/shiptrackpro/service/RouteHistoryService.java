package com.shiptrackpro.service;

import com.shiptrackpro.entity.RouteHistory;

import java.util.List;

/**
 * Service interface for managing route histories.
 */
public interface RouteHistoryService {

    /**
     * Saves a route history record.
     *
     * @param routeHistory the RouteHistory record to save
     * @return the saved RouteHistory record
     */
    RouteHistory saveRouteHistory(RouteHistory routeHistory);

    /**
     * Retrieves all route history records for a specific shipment, sorted by timestamp ascending.
     *
     * @param shipmentId the ID or tracking number of the shipment
     * @return list of RouteHistory records
     */
    List<RouteHistory> getRouteHistoryByShipmentId(String shipmentId);

    /**
     * Deletes a route history record by its ID.
     *
     * @param id the ID of the RouteHistory record to delete
     */
    void deleteRouteHistory(Long id);
}
