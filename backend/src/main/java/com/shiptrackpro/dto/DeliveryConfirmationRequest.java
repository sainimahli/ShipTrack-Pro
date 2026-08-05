package com.shiptrackpro.dto;

import jakarta.validation.constraints.NotBlank;

public class DeliveryConfirmationRequest {

    @NotBlank(message = "Receiver name is required")
    private String receiverName;

    private String remarks;

    public DeliveryConfirmationRequest() {
    }

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

}
