package com.shiptrackpro.service.impl;

import com.shiptrackpro.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Override
    public void sendOtpEmail(String toEmail, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(toEmail);
        message.setSubject("ShipTrack Pro Password Reset OTP");

        message.setText(
                "Hello,\n\n" +
                        "Your OTP for resetting your ShipTrack Pro account password is:\n\n" +
                        otp +
                        "\n\nThis OTP is valid for 10 minutes.\n\n" +
                        "If you did not request this password reset, please ignore this email.\n\n" +
                        "Regards,\n" +
                        "ShipTrack Pro Team"
        );

        mailSender.send(message);
    }
    @Override
    public void sendDeliveryOtpEmail(
            String toEmail,
            String otp,
            String trackingNumber
    ) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(toEmail);

        message.setSubject("Delivery Verification OTP");

        message.setText(
                "Hello,\n\n" +
                        "Your shipment is out for delivery.\n\n" +
                        "Tracking Number: " + trackingNumber + "\n\n" +
                        "Delivery OTP: " + otp + "\n\n" +
                        "Please share this OTP with the delivery personnel only after receiving your shipment.\n\n" +
                        "Regards,\n" +
                        "ShipTrack Pro Team"
        );

        mailSender.send(message);
    }

    @Override
    public void sendDeliverySuccessEmail(
            String toEmail,
            String trackingNumber
    ) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(toEmail);
        message.setSubject("Shipment Delivered Successfully");

        message.setText(
                "Hello,\n\n" +
                        "Your shipment has been delivered successfully.\n\n" +
                        "Tracking Number: " + trackingNumber + "\n\n" +
                        "Thank you for choosing ShipTrack Pro.\n\n" +
                        "Regards,\n" +
                        "ShipTrack Pro Team"
        );

        mailSender.send(message);
    }
}