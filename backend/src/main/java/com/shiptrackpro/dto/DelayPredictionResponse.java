package com.shiptrackpro.dto;

import com.shiptrackpro.enums.DelayRisk;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DelayPredictionResponse {

    private Long shipmentId;
    private DelayRisk delayRisk;
    private long predictedDelayMinutes;

    /** Human-readable explanation of which factors drove this prediction. */
    private String reason;

    private LocalDateTime estimatedDeliveryDate;
    private LocalDateTime evaluatedAt;

}
