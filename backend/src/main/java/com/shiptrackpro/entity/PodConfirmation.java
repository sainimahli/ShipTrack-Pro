package com.shiptrackpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import com.shiptrackpro.enums.ConfirmationStatus;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pod_confirmations")
public class PodConfirmation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "confirmation_id")
    private Long confirmationId;

    @Column(name = "shipment_id", nullable = false, unique = true)
    private Long shipmentId;

    @Column(name = "delivered_to_name", length = 100)
    private String deliveredToName;

    @Column(name = "signature_url")
    private String signatureUrl;

    @Column(name = "delivery_notes")
    private String deliveryNotes;

    @Column(name = "verification_method", length = 20)
    private String verificationMethod;

    @Column(name = "delivered_at")
    private OffsetDateTime deliveredAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ConfirmationStatus status = ConfirmationStatus.PENDING;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();

        if (this.status == null) {
            this.status = ConfirmationStatus.PENDING;
        }
    }
}