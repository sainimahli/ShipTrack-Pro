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
}