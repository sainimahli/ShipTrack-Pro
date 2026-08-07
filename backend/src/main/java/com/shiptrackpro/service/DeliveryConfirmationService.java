package com.shiptrackpro.service;

import com.shiptrackpro.dto.DeliveryConfirmationRequest;
import com.shiptrackpro.dto.DeliveryConfirmationResponse;

public interface DeliveryConfirmationService {

    /**
     * Sends OTP to customer before delivery confirmation.
     */
    void sendDeliveryOtp(Long shipmentId);


    /**
     * Verifies OTP and confirms delivery.
     */
    DeliveryConfirmationResponse verifyDeliveryOtp(
            Long shipmentId,
            String otp,
            DeliveryConfirmationRequest request,
            Long confirmedByUserId
    );


    /**
     * Existing confirmation method.
     * Called internally after OTP verification.
     */
    DeliveryConfirmationResponse confirmDelivery(
            Long shipmentId,
            DeliveryConfirmationRequest request,
            Long confirmedByUserId
    );


    /**
     * Gets delivery confirmation details.
     */
    DeliveryConfirmationResponse getConfirmation(Long shipmentId);

}