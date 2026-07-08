package com.shiptrackpro.repository;

import com.shiptrackpro.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for {@link Shipment}.
 *
 * <p>{@code existsByTrackingNumber} backs the collision check in
 * {@code ShipmentServiceImpl.generateUniqueTrackingNumber()} — it re-rolls
 * a random tracking number until one isn't already in use.</p>
 */
@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    boolean existsByTrackingNumber(String trackingNumber);

}
