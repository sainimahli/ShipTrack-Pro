package com.shiptrackpro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

/**
 * Entity representing a point in the route history of a shipment.
 */
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "route_histories")
public class RouteHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @jakarta.validation.constraints.NotBlank(message = "Shipment ID is required")
    @Column(name = "shipment_id", nullable = false)
    private String shipmentId;

    @jakarta.validation.constraints.NotNull(message = "Latitude is required")
    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @jakarta.validation.constraints.NotNull(message = "Longitude is required")
    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @jakarta.validation.constraints.NotBlank(message = "Location Name is required")
    @Column(name = "location_name", length = 255)
    private String locationName;

    @jakarta.validation.constraints.NotBlank(message = "Status is required")
    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
}
