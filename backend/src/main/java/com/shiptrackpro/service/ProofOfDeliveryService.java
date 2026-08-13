package com.shiptrackpro.service;

import com.shiptrackpro.dto.ProofOfDeliveryRequest;
import com.shiptrackpro.dto.ProofOfDeliveryResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import com.shiptrackpro.dto.ProofOfDeliveryListResponse;

import java.time.OffsetDateTime;
import java.util.List;
import java.time.OffsetDateTime;

public interface ProofOfDeliveryService {

    ProofOfDeliveryResponse createProofOfDelivery(ProofOfDeliveryRequest request);

    ProofOfDeliveryResponse createProofOfDeliveryFromUrls(
            Long shipmentId,
            String deliveredToName,
            String signatureUrl,
            String deliveryNotes,
            String verificationMethod,
            OffsetDateTime deliveredAt,
            List<String> imageUrls);

    ProofOfDeliveryResponse getProofOfDelivery(Long podId);

    ResponseEntity<byte[]> downloadSignature(Long podId);

    ResponseEntity<byte[]> downloadPdf(Long podId);

    ResponseEntity<byte[]> downloadImage(String url);

    List<ProofOfDeliveryListResponse> getAllProofOfDeliveries();

}