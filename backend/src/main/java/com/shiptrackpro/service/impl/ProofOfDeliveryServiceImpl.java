package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.ProofOfDeliveryRequest;
import com.shiptrackpro.dto.ProofOfDeliveryResponse;
import com.shiptrackpro.entity.Address;
import com.shiptrackpro.entity.ProofOfDelivery;
import com.shiptrackpro.entity.ProofOfDeliveryImage;
import com.shiptrackpro.entity.Shipment;
import com.shiptrackpro.exception.ResourceNotFoundException;
import com.shiptrackpro.repository.AddressRepository;
import com.shiptrackpro.repository.ProofOfDeliveryImageRepository;
import com.shiptrackpro.repository.ProofOfDeliveryRepository;
import com.shiptrackpro.repository.ShipmentRepository;
import com.shiptrackpro.repository.UserRepository;
import com.shiptrackpro.service.ProofOfDeliveryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.shiptrackpro.service.CloudinaryService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import com.lowagie.text.Image;

import java.net.URL;

import java.io.ByteArrayOutputStream;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;

import java.util.List;

@Service
@Transactional
public class ProofOfDeliveryServiceImpl implements ProofOfDeliveryService {

    private final ProofOfDeliveryRepository proofOfDeliveryRepository;
    private final ProofOfDeliveryImageRepository proofOfDeliveryImageRepository;
    private final ShipmentRepository shipmentRepository;
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;

    public ProofOfDeliveryServiceImpl(
            ProofOfDeliveryRepository proofOfDeliveryRepository,
            ProofOfDeliveryImageRepository proofOfDeliveryImageRepository,
            ShipmentRepository shipmentRepository,
            AddressRepository addressRepository,
            UserRepository userRepository,
            CloudinaryService cloudinaryService) {

        this.proofOfDeliveryRepository = proofOfDeliveryRepository;
        this.proofOfDeliveryImageRepository = proofOfDeliveryImageRepository;
        this.shipmentRepository = shipmentRepository;
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.cloudinaryService = cloudinaryService;
    }

    @Override
    @Transactional
    public ProofOfDeliveryResponse createProofOfDelivery(ProofOfDeliveryRequest request) {

        Shipment shipment = findShipmentOrThrow(request.getShipmentId());

        if (proofOfDeliveryRepository.findByShipmentId(request.getShipmentId()).isPresent()) {
            throw new IllegalArgumentException(
                    "Proof of Delivery already exists for this shipment.");
        }

        if (request.getImages() != null && request.getImages().size() > 6) {
            throw new IllegalArgumentException(
                    "A maximum of 5 images can be uploaded.");
        }

        String signatureUrl = null;

        if (request.getSignature() != null && !request.getSignature().isEmpty()) {
            signatureUrl = cloudinaryService.uploadImage(request.getSignature());
        }

        ProofOfDelivery proofOfDelivery = ProofOfDelivery.builder()
                .shipmentId(request.getShipmentId())
                .deliveredToName(request.getDeliveredToName())
                .signatureUrl(signatureUrl)
                .deliveryNotes(request.getDeliveryNotes())
                .verificationMethod(request.getVerificationMethod())
                .deliveredAt(request.getDeliveredAt())
                .build();

        ProofOfDelivery savedPod = proofOfDeliveryRepository.save(proofOfDelivery);

        if (request.getImages() != null && !request.getImages().isEmpty()) {

            List<ProofOfDeliveryImage> images = request.getImages()
                    .stream()
                    .map(file -> {

                        String imageUrl = cloudinaryService.uploadImage(file);

                        return ProofOfDeliveryImage.builder()
                                .podId(savedPod.getPodId())
                                .imageUrl(imageUrl)
                                .build();

                    })
                    .toList();

            proofOfDeliveryImageRepository.saveAll(images);
        }

        return mapToResponse(savedPod, shipment);
    }

    private Shipment findShipmentOrThrow(Long shipmentId) {
        return shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Shipment not found with id: " + shipmentId));
    }

    private ProofOfDeliveryResponse mapToResponse(
            ProofOfDelivery proofOfDelivery,
            Shipment shipment) {

        Address senderAddress = shipment.getSenderAddressId() == null
                ? null
                : addressRepository.findById(shipment.getSenderAddressId()).orElse(null);

        Address receiverAddress = shipment.getReceiverAddressId() == null
                ? null
                : addressRepository.findById(shipment.getReceiverAddressId()).orElse(null);

        List<String> images = proofOfDeliveryImageRepository
                .findByPodId(proofOfDelivery.getPodId())
                .stream()
                .map(ProofOfDeliveryImage::getImageUrl)
                .toList();

        return ProofOfDeliveryResponse.builder()
                .podId(proofOfDelivery.getPodId())
                .shipmentId(proofOfDelivery.getShipmentId())
                .deliveredToName(proofOfDelivery.getDeliveredToName())
                .signatureUrl(proofOfDelivery.getSignatureUrl())
                .deliveryNotes(proofOfDelivery.getDeliveryNotes())
                .verificationMethod(proofOfDelivery.getVerificationMethod())
                .isVerified(proofOfDelivery.getIsVerified())
                .deliveredAt(proofOfDelivery.getDeliveredAt())

                .trackingNumber(shipment.getTrackingNumber())
                .totalWeightKg(shipment.getTotalWeightKg())
                .shipmentType(shipment.getShipmentType())
                .expectedDeliveryDate(shipment.getExpectedDeliveryDate())

                .senderCity(senderAddress == null ? null : senderAddress.getCity())
                .receiverCity(receiverAddress == null ? null : receiverAddress.getCity())

                .images(images)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ProofOfDeliveryResponse getProofOfDelivery(Long podId) {

        ProofOfDelivery proofOfDelivery = proofOfDeliveryRepository.findById(podId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Proof of Delivery not found with id: " + podId));

        Shipment shipment = findShipmentOrThrow(proofOfDelivery.getShipmentId());

        return mapToResponse(proofOfDelivery, shipment);
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadSignature(Long podId) {

        ProofOfDelivery proofOfDelivery = proofOfDeliveryRepository.findByPodId(podId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Proof of Delivery not found with id: " + podId));

        if (proofOfDelivery.getSignatureUrl() == null ||
                proofOfDelivery.getSignatureUrl().isBlank()) {

            throw new ResourceNotFoundException("Signature not found.");
        }

        try {

            URL url = new URL(proofOfDelivery.getSignatureUrl());

            InputStream inputStream = url.openStream();

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            byte[] buffer = new byte[4096];

            int bytesRead;

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }

            inputStream.close();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=signature.png")
                    .contentType(MediaType.IMAGE_PNG)
                    .body(outputStream.toByteArray());

        } catch (Exception e) {

            throw new RuntimeException("Failed to download signature.", e);

        }
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadPdf(Long podId) {

        ProofOfDeliveryResponse response = getProofOfDelivery(podId);

        try {

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            Document document = new Document();

            PdfWriter.getInstance(document, outputStream);

            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22);

            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);

            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

            document.add(new Paragraph(" "));
            document.add(new Paragraph("SHIPTRACK PRO", titleFont));
            document.add(new Paragraph("PROOF OF DELIVERY", subTitleFont));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("=============================================================="));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("POD INFORMATION", subTitleFont));

            document.add(new Paragraph("----------------------------------------"));

            PdfPTable podTable = new PdfPTable(2);

            podTable.setWidthPercentage(100);

            podTable.addCell("POD ID");
            podTable.addCell(String.valueOf(response.getPodId()));

            podTable.addCell("Shipment ID");
            podTable.addCell(String.valueOf(response.getShipmentId()));

            podTable.addCell("Tracking Number");
            podTable.addCell(response.getTrackingNumber());

            document.add(podTable);

            document.add(new Paragraph(" "));

            document.add(new Paragraph("DELIVERY INFORMATION", subTitleFont));

            document.add(new Paragraph("----------------------------------------"));

            PdfPTable deliveryTable = new PdfPTable(2);

            deliveryTable.setWidthPercentage(100);

            deliveryTable.addCell("Delivered To");
            deliveryTable.addCell(response.getDeliveredToName());

            deliveryTable.addCell("Verification");
            deliveryTable.addCell(response.getVerificationMethod());

            deliveryTable.addCell("Delivered At");
            deliveryTable.addCell(String.valueOf(response.getDeliveredAt()));

            document.add(deliveryTable);

            document.add(new Paragraph(" "));

            document.add(new Paragraph("Sender City : " + response.getSenderCity()));
            document.add(new Paragraph("Receiver City : " + response.getReceiverCity()));
            document.add(new Paragraph("Expected Delivery : " + response.getExpectedDeliveryDate()));
            document.add(new Paragraph("Total Weight : " + response.getTotalWeightKg()));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Delivery Notes"));
            document.add(new Paragraph(response.getDeliveryNotes()));

            document.add(new Paragraph(" "));
            document.add(new Paragraph("CUSTOMER SIGNATURE", subTitleFont));
            document.add(new Paragraph("----------------------------------------"));

            if (response.getSignatureUrl() != null &&
                    !response.getSignatureUrl().isBlank()) {

                Image signature = Image.getInstance(new URL(response.getSignatureUrl()));

                signature.scaleToFit(220, 120);

                signature.setAlignment(Image.ALIGN_CENTER);

                document.add(signature);

            }

            if (response.getImages() != null && !response.getImages().isEmpty()) {

                document.newPage();

                document.add(new Paragraph("PACKAGE IMAGES", subTitleFont));
                document.add(new Paragraph("----------------------------------------"));                

                for (String imageUrl : response.getImages()) {
                    

                    Image image = Image.getInstance(new URL(imageUrl));

                    image.scaleToFit(350, 250);

                    image.setAlignment(Image.ALIGN_CENTER);

                    document.add(image);

                    document.add(new Paragraph(" "));

                    
                }

            }
            document.close();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=ProofOfDelivery_" + podId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(outputStream.toByteArray());

        } catch (Exception e) {

            e.printStackTrace();

            throw new RuntimeException("Failed to generate PDF.", e);

        }
    }

    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadImage(String url) {

        try {

            URL imageUrl = new URL(url);

            InputStream inputStream = imageUrl.openStream();

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            byte[] buffer = new byte[4096];

            int bytesRead;

            while ((bytesRead = inputStream.read(buffer)) != -1) {

                outputStream.write(buffer, 0, bytesRead);

            }

            inputStream.close();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=pod-image")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(outputStream.toByteArray());

        } catch (Exception e) {

            throw new RuntimeException("Failed to download image.", e);

        }

    }

}