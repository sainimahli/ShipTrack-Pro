package com.shiptrackpro.entity;

import com.shiptrackpro.enums.ShipmentStatus;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "tracking_events",
        indexes = {
                @Index(name = "idx_tracking_events_shipment_id", columnList = "shipment_id"),
                @Index(name = "idx_tracking_events_updated_at", columnList = "updated_at")
        }
)
public class TrackingEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "shipment_id",
            referencedColumnName = "shipment_id",
            nullable = false
    )
    private Shipment shipment;

    @Column(name = "tracking_number", length = 50)
    private String trackingNumberCache;

    @Enumerated(EnumType.STRING)
    @Column(name = "shipment_status", nullable = false)
    private ShipmentStatus status;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "location_name")
    private String locationName;

    @Column(name = "description")
    private String description;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public TrackingEvent() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Shipment getShipment() {
        return shipment;
    }

    public void setShipment(Shipment shipment) {
        this.shipment = shipment;
    }

    @Transient
    public String getTrackingNumber() {
        return shipment != null
                ? shipment.getTrackingNumber()
                : trackingNumberCache;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumberCache = trackingNumber;
    }

    public String getTrackingNumberCache() {
        return trackingNumberCache;
    }

    public void setTrackingNumberCache(String trackingNumberCache) {
        this.trackingNumberCache = trackingNumberCache;
    }

    public ShipmentStatus getStatus() {
        return status;
    }

    public void setStatus(ShipmentStatus status) {
        this.status = status;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}