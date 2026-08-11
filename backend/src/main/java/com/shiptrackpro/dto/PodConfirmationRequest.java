package com.shiptrackpro.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PodConfirmationRequest {

    private Long shipmentId;

    private String deliveredToName;

    private MultipartFile signature;

    private String deliveryNotes;

    private String verificationMethod;

    private OffsetDateTime deliveredAt;

    private List<MultipartFile> images;
}