package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.PodConfirmationListResponse;
import com.shiptrackpro.dto.PodConfirmationRequest;
import com.shiptrackpro.dto.PodConfirmationResponse;
import com.shiptrackpro.entity.PodConfirmation;
import com.shiptrackpro.entity.PodConfirmationImage;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.enums.ConfirmationStatus;
import com.shiptrackpro.exception.ResourceNotFoundException;
import com.shiptrackpro.repository.PodConfirmationImageRepository;
import com.shiptrackpro.repository.PodConfirmationRepository;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.service.CloudinaryService;
import com.shiptrackpro.service.PodConfirmationService;
import com.shiptrackpro.service.ProofOfDeliveryService;
import com.shiptrackpro.dto.ProofOfDeliveryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.shiptrackpro.dto.PodConfirmationListResponse;

import java.util.List;

@Service
@Transactional
public class PodConfirmationServiceImpl implements PodConfirmationService {

    private final PodConfirmationRepository podConfirmationRepository;
    private final PodConfirmationImageRepository podConfirmationImageRepository;
    private final ShipmentRepository shipmentRepository;
    private final CloudinaryService cloudinaryService;
    private final ProofOfDeliveryService proofOfDeliveryService;

    public PodConfirmationServiceImpl(
            PodConfirmationRepository podConfirmationRepository,
            PodConfirmationImageRepository podConfirmationImageRepository,
            ShipmentRepository shipmentRepository,
            CloudinaryService cloudinaryService,
            ProofOfDeliveryService proofOfDeliveryService) {

        this.podConfirmationRepository = podConfirmationRepository;
        this.podConfirmationImageRepository = podConfirmationImageRepository;
        this.shipmentRepository = shipmentRepository;
        this.cloudinaryService = cloudinaryService;
        this.proofOfDeliveryService = proofOfDeliveryService;
    }

    @Override
    public PodConfirmationResponse createConfirmation(
            PodConfirmationRequest request) {

        Shipment shipment = shipmentRepository.findById(request.getShipmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Shipment not found with id: " + request.getShipmentId()));

        if (podConfirmationRepository
                .findByShipmentId(request.getShipmentId())
                .isPresent()) {

            throw new IllegalArgumentException(
                    "A POD confirmation already exists for this shipment.");
        }

        String signatureUrl = null;

        if (request.getSignature() != null
                && !request.getSignature().isEmpty()) {

            signatureUrl = cloudinaryService.uploadImage(request.getSignature());
        }

        PodConfirmation confirmation = PodConfirmation.builder()
                .shipmentId(request.getShipmentId())
                .deliveredToName(request.getDeliveredToName())
                .signatureUrl(signatureUrl)
                .deliveryNotes(request.getDeliveryNotes())
                .verificationMethod(request.getVerificationMethod())
                .deliveredAt(request.getDeliveredAt())
                .status(ConfirmationStatus.PENDING)
                .build();

        PodConfirmation savedConfirmation = podConfirmationRepository.save(confirmation);

        if (request.getImages() != null
                && !request.getImages().isEmpty()) {

            List<PodConfirmationImage> images = request.getImages()
                    .stream()
                    .map(file -> {

                        String imageUrl = cloudinaryService.uploadImage(file);

                        return PodConfirmationImage.builder()
                                .confirmationId(
                                        savedConfirmation.getConfirmationId())
                                .imageUrl(imageUrl)
                                .build();
                    })
                    .toList();

            podConfirmationImageRepository.saveAll(images);
        }

        return mapToResponse(savedConfirmation);
    }

    @Override
    public PodConfirmationResponse confirmDelivery(
            Long confirmationId) {

        PodConfirmation confirmation = podConfirmationRepository.findById(confirmationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "POD confirmation not found with id: "
                                + confirmationId));

        if (confirmation.getStatus() != ConfirmationStatus.PENDING) {
            throw new IllegalArgumentException(
                    "This POD confirmation has already been processed.");
        }

        List<String> imageUrls = podConfirmationImageRepository
                .findByConfirmationId(confirmationId)
                .stream()
                .map(PodConfirmationImage::getImageUrl)
                .toList();

        ProofOfDeliveryResponse podResponse = proofOfDeliveryService.createProofOfDeliveryFromUrls(
                confirmation.getShipmentId(),
                confirmation.getDeliveredToName(),
                confirmation.getSignatureUrl(),
                confirmation.getDeliveryNotes(),
                confirmation.getVerificationMethod(),
                confirmation.getDeliveredAt(),
                imageUrls);

        confirmation.setStatus(ConfirmationStatus.CONFIRMED);
        confirmation.setConfirmedAt(java.time.OffsetDateTime.now());

        podConfirmationRepository.save(confirmation);

        return mapToResponse(confirmation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PodConfirmationListResponse> getAllConfirmations() {

        return podConfirmationRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(confirmation -> PodConfirmationListResponse.builder()
                        .confirmationId(confirmation.getConfirmationId())
                        .shipmentId(confirmation.getShipmentId())
                        .deliveredToName(confirmation.getDeliveredToName())
                        .status(confirmation.getStatus())
                        .build())
                .toList();
    }

    private PodConfirmationResponse mapToResponse(
            PodConfirmation confirmation) {

        return PodConfirmationResponse.builder()
                .confirmationId(confirmation.getConfirmationId())
                .shipmentId(confirmation.getShipmentId())
                .deliveredToName(confirmation.getDeliveredToName())
                .deliveryNotes(confirmation.getDeliveryNotes())
                .verificationMethod(confirmation.getVerificationMethod())
                .deliveredAt(confirmation.getDeliveredAt())
                .status(confirmation.getStatus())
                .createdAt(confirmation.getCreatedAt())
                .confirmedAt(confirmation.getConfirmedAt())
                .build();
    }
}