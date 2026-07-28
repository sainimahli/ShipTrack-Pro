package com.shiptrackpro.entity;

import com.shiptrackpro.enums.ShipmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "shipmentId")
@Entity
@Table(name = "shipments")
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shipment_id")
    private Long shipmentId;

    @Column(name = "tracking_number", nullable = false, unique = true)
    private String trackingNumber;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "sender_address_id", nullable = false)
    private Long senderAddressId;

    @Column(name = "receiver_address_id", nullable = false)
    private Long receiverAddressId;

    @Column(name = "origin_warehouse_id")
    private Long originWarehouseId;

    @Column(name = "destination_warehouse_id")
    private Long destinationWarehouseId;

    @Column(name = "assigned_driver_id")
    private Long assignedDriverId;

    @Column(name = "assigned_vehicle_id")
    private Long assignedVehicleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "shipment_status", nullable = false)
    private ShipmentStatus shipmentStatus;

    @Column(
            name = "total_weight_kg",
            precision = 10,
            scale = 2
    )
    private BigDecimal totalWeightKg;

    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;

    @Column(name = "actual_delivery_date")
    private OffsetDateTime actualDeliveryDate;

    @Column(name = "estimated_arrival")
    private OffsetDateTime estimatedArrival;

    @Column(
            name = "distance_remaining_km",
            precision = 10,
            scale = 2
    )
    private BigDecimal distanceRemainingKm;

    @Column(name = "forecast_confidence", length = 20)
    private String forecastConfidence;

    @Column(name = "is_delayed")
    private Boolean isDelayed;

    @Column(name = "delay_reason", length = 255)
    private String delayReason;

    @Column(name = "shipment_type", length = 20)
    private String shipmentType;

    @Column(name = "package_type", length = 50)
    private String packageType;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;

        if (this.shipmentStatus == null) {
            this.shipmentStatus = ShipmentStatus.CREATED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}