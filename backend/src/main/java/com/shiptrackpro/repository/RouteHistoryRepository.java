package com.shiptrackpro.repository;

import com.shiptrackpro.entity.RouteHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for RouteHistory entity.
 */
@Repository
public interface RouteHistoryRepository extends JpaRepository<RouteHistory, Long> {

    /**
     * Find all route history records for a specific shipment, sorted by timestamp ascending.
     *
     * @param shipmentId the ID or tracking number of the shipment
     * @return list of RouteHistory records
     */
    List<RouteHistory> findByShipmentIdOrderByTimestampAsc(String shipmentId);
}
