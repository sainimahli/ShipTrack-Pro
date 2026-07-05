package com.shiptrackpro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * Inbound payload for creating or updating a shipment.
 *
 * <p>Deliberately excludes {@code id}, {@code trackingNumber},
 * {@code shipmentStatus}, {@code createdAt}, and {@code updatedAt} — those
 * are system-managed (generated or defaulted server-side) and must never
 * be set by the client.</p>
 */
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentRequest {

    @NotBlank(message = "Sender name is required")
    @Size(max = 150, message = "Sender name must not exceed 150 characters")
    private String senderName;

    @NotBlank(message = "Sender phone is required")
    @Size(max = 20, message = "Sender phone must not exceed 20 characters")
    private String senderPhone;

    @NotBlank(message = "Receiver name is required")
    @Size(max = 150, message = "Receiver name must not exceed 150 characters")
    private String receiverName;

    @NotBlank(message = "Receiver phone is required")
    @Size(max = 20, message = "Receiver phone must not exceed 20 characters")
    private String receiverPhone;

    @Size(max = 50, message = "Package type must not exceed 50 characters")
    private String packageType;

    @NotNull(message = "Package weight is required")
    @Positive(message = "Package weight must be greater than zero")
    private Double packageWeight;

    @NotBlank(message = "Origin is required")
    @Size(max = 255, message = "Origin must not exceed 255 characters")
    private String origin;

    @NotBlank(message = "Destination is required")
    @Size(max = 255, message = "Destination must not exceed 255 characters")
    private String destination;

    @NotBlank(message = "Delivery address is required")
    @Size(max = 255, message = "Delivery address must not exceed 255 characters")
    private String deliveryAddress;

}

