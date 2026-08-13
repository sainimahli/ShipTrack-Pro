package com.shiptrackpro.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.shiptrackpro.dto.ShipmentWithLatestLocationDto;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.enums.ShipmentStatus;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    Optional<Shipment> findByTrackingNumber(String trackingNumber);

    boolean existsByTrackingNumber(String trackingNumber);

    @Query("""
        SELECT new com.shiptrackpro.dto.ShipmentWithLatestLocationDto(
            s,
            te.latitude,
            te.longitude
        )
        FROM Shipment s
        LEFT JOIN TrackingEvent te ON te.id = (
            SELECT te2.id
            FROM TrackingEvent te2
            WHERE (te2.shipment = s OR te2.trackingNumberCache = s.trackingNumber)
              AND (
                    te2.latitude IS NOT NULL
                 OR te2.longitude IS NOT NULL
                 OR te2.locationName IS NOT NULL
              )
            ORDER BY te2.updatedAt DESC
            LIMIT 1
        )
    """)
    List<ShipmentWithLatestLocationDto> findAllWithLatestLocation();

    long countByShipmentStatus(ShipmentStatus shipmentStatus);

    List<Shipment> findByCreatedAtBetween(
            OffsetDateTime start,
            OffsetDateTime end
    );

    // Customer / Business Dashboard

    List<Shipment> findByUserId(Long userId);

    long countByUserId(Long userId);

    long countByUserIdAndShipmentStatus(
            Long userId,
            ShipmentStatus shipmentStatus
    );

    long countByUserIdAndShipmentStatusIn(
            Long userId,
            List<ShipmentStatus> shipmentStatuses
    );

    long countByUserIdAndIsDelayedTrue(Long userId);

    // Admin Dashboard

    long countByIsDelayedTrue();
}