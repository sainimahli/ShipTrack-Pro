package com.shiptrackpro.repository;

import com.shiptrackpro.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for {@link Shipment}.
 */
@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    Optional<Shipment> findByTrackingNumber(String trackingNumber);

    boolean existsByTrackingNumber(String trackingNumber);

    @org.springframework.data.jpa.repository.Query("""
        SELECT new com.shiptrackpro.dto.ShipmentWithLatestLocationDto(
            s,
            te.latitude,
            te.longitude
        )
        FROM Shipment s
        LEFT JOIN TrackingEvent te ON te.id = (
            SELECT te2.id FROM TrackingEvent te2
            WHERE (te2.shipment = s OR te2.trackingNumberCache = s.trackingNumber)
              AND (te2.latitude IS NOT NULL OR te2.longitude IS NOT NULL OR te2.locationName IS NOT NULL)
            ORDER BY te2.updatedAt DESC LIMIT 1
        )
        """)
    java.util.List<com.shiptrackpro.dto.ShipmentWithLatestLocationDto> findAllWithLatestLocation();
}
