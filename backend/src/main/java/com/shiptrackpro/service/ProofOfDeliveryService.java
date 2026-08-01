package com.shiptrackpro.service;

import com.shiptrackpro.dto.ProofOfDeliveryRequest;
import com.shiptrackpro.dto.ProofOfDeliveryResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;

public interface ProofOfDeliveryService {

    ProofOfDeliveryResponse createProofOfDelivery(ProofOfDeliveryRequest request);

    ProofOfDeliveryResponse getProofOfDelivery(Long podId);

    ResponseEntity<byte[]> downloadSignature(Long podId);

    ResponseEntity<byte[]> downloadPdf(Long podId);

    ResponseEntity<byte[]> downloadImage(String url);
}