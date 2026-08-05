package com.shiptrackpro.dto;

import java.time.LocalDateTime;

public class DeliveryConfirmationResponse {

    private Long id;
    private Long shipmentId;
    private String receiverName;
    private String remarks;
    private LocalDateTime confirmedAt;
    private Long confirmedByUserId;
    private String confirmedByName;

    public DeliveryConfirmationResponse() {
    }

    public DeliveryConfirmationResponse(Long id, Long shipmentId, String receiverName, String remarks,
                                        LocalDateTime confirmedAt, Long confirmedByUserId, String confirmedByName) {
        this.id = id;
        this.shipmentId = shipmentId;
        this.receiverName = receiverName;
        this.remarks = remarks;
        this.confirmedAt = confirmedAt;
        this.confirmedByUserId = confirmedByUserId;
        this.confirmedByName = confirmedByName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getShipmentId() {
        return shipmentId;
    }

    public void setShipmentId(Long shipmentId) {
        this.shipmentId = shipmentId;
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

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public Long getConfirmedByUserId() {
        return confirmedByUserId;
    }

    public void setConfirmedByUserId(Long confirmedByUserId) {
        this.confirmedByUserId = confirmedByUserId;
    }

    public String getConfirmedByName() {
        return confirmedByName;
    }

    public void setConfirmedByName(String confirmedByName) {
        this.confirmedByName = confirmedByName;
    }

}
