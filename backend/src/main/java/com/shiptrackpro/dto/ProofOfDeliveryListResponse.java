package com.shiptrackpro.dto;

import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProofOfDeliveryListResponse {

    private Long podId;

    private Long shipmentId;

    private OffsetDateTime deliveredAt;

    private String deliveredToName;
}