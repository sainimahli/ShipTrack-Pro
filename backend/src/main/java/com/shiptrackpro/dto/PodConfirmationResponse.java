package com.shiptrackpro.dto;

import com.shiptrackpro.enums.ConfirmationStatus;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PodConfirmationResponse {

    private Long confirmationId;

    private Long shipmentId;

    private String deliveredToName;

    private String deliveryNotes;

    private String verificationMethod;

    private OffsetDateTime deliveredAt;

    private ConfirmationStatus status;

    private OffsetDateTime createdAt;

    private OffsetDateTime confirmedAt;
}