package com.shiptrackpro.service;

public interface EmailService {

    /**
     * Sends OTP email for password reset.
     *
     * @param toEmail Recipient email address
     * @param otp      One-Time Password
     */
    void sendOtpEmail(String toEmail, String otp);

    /**
     * Sends delivery success email after OTP verification.
     *
     * @param toEmail        Recipient email address
     * @param trackingNumber Shipment tracking number
     */
    void sendDeliveryOtpEmail(
            String toEmail,
            String otp,
            String trackingNumber
    );
    void sendDeliverySuccessEmail(
            String toEmail,
            String trackingNumber
    );
}