package com.shiptrackpro.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProofOfDeliveryResponse {

    // POD Details
    private Long podId;
    private Long shipmentId;
    private String deliveredToName;
    private String signatureUrl;
    private String deliveryNotes;
    private String verificationMethod;
    private Boolean isVerified;
    private OffsetDateTime deliveredAt;

    // Shipment Details
    private String trackingNumber;
    private BigDecimal totalWeightKg;
    private String shipmentType;
    private LocalDate expectedDeliveryDate;

    // Address Details
    private String senderCity;
    private String receiverCity;

    // Package Images
    private List<String> images;
}