package com.shiptrackpro.dto;

import com.shiptrackpro.enums.ConfirmationStatus;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PodConfirmationListResponse {

    private Long confirmationId;

    private Long shipmentId;

    private String deliveredToName;

    private ConfirmationStatus status;
}