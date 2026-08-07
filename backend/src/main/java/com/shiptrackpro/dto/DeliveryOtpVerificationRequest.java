package com.shiptrackpro.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeliveryOtpVerificationRequest extends DeliveryConfirmationRequest {

    @NotBlank(message = "OTP is required")
    private String otp;

}