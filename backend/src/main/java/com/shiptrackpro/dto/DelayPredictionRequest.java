package com.shiptrackpro.dto;

import com.shiptrackpro.enums.TrafficLevel;
import com.shiptrackpro.enums.WeatherCondition;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Live signals supplied at prediction time. Deliberately does NOT include
 * shipmentStatus or estimatedDeliveryDate — those are read from the
 * existing {@code Shipment} entity by id, not trusted from the client, so
 * a caller can't claim a shipment is in a different state than it
 * actually is.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DelayPredictionRequest {

    /** Remaining travel distance in kilometers. Optional — omit if unknown. */
    @PositiveOrZero(message = "Distance remaining cannot be negative")
    private Double distanceRemainingKm;

    /** Defaults to MEDIUM in the service if not supplied. */
    private TrafficLevel trafficLevel;

    /** Optional. Defaults to CLEAR (no weather-related delay) if omitted. */
    private WeatherCondition weatherCondition;

}
