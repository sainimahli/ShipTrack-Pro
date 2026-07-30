package com.shiptrackpro.repository;

import com.shiptrackpro.entity.TrackingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shiptrackpro.entity.Shipment;

import java.util.List;
import java.util.Optional;

public interface TrackingEventRepository extends JpaRepository<TrackingEvent, Long> {

    @Query("""
        SELECT te FROM TrackingEvent te 
        WHERE (te.shipment.trackingNumber = :trackingNumber OR te.trackingNumberCache = :trackingNumber)
        ORDER BY te.updatedAt ASC
        """)
    List<TrackingEvent> findByTrackingNumberOrderByUpdatedAtAsc(@Param("trackingNumber") String trackingNumber);

    @Query("""
        SELECT te FROM TrackingEvent te 
        WHERE (te.shipment.trackingNumber = :trackingNumber OR te.trackingNumberCache = :trackingNumber)
        ORDER BY te.updatedAt DESC LIMIT 1
        """)
    Optional<TrackingEvent> findFirstByTrackingNumberOrderByUpdatedAtDesc(@Param("trackingNumber") String trackingNumber);

    @Query("""
        SELECT te FROM TrackingEvent te 
        WHERE (te.shipment.trackingNumber = :trackingNumber OR te.trackingNumberCache = :trackingNumber)
          AND te.locationName IS NOT NULL 
        ORDER BY te.updatedAt DESC LIMIT 1
        """)
    Optional<TrackingEvent> findFirstByTrackingNumberAndLocationNameIsNotNullOrderByUpdatedAtDesc(
            @Param("trackingNumber") String trackingNumber);

    @Query("""
        SELECT te FROM TrackingEvent te 
        WHERE (te.shipment.trackingNumber = :trackingNumber OR te.trackingNumberCache = :trackingNumber)
          AND (te.latitude IS NOT NULL OR te.longitude IS NOT NULL OR te.locationName IS NOT NULL)
        ORDER BY te.updatedAt DESC LIMIT 1
        """)
    Optional<TrackingEvent> findLatestLocationByTrackingNumber(@Param("trackingNumber") String trackingNumber);

    @Query("""
        SELECT CASE WHEN COUNT(te) > 0 THEN TRUE ELSE FALSE END 
        FROM TrackingEvent te 
        WHERE te.shipment.trackingNumber = :trackingNumber OR te.trackingNumberCache = :trackingNumber
        """)
    boolean existsByTrackingNumber(@Param("trackingNumber") String trackingNumber);

    List<TrackingEvent> findByShipmentOrderByUpdatedAtAsc(Shipment shipment);
}