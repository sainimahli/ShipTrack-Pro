package com.shiptrackpro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * A delay/status alert raised against a shipment.
 *
 * NOTE: I don't have visibility into your project to confirm whether an
 * Alert entity already exists - if it does, compare field names against
 * this before dropping this file in, since the spec you gave me
 * (shipment relation, alertType, isRead) doesn't match a DelayAlert
 * entity built earlier in this conversation for a different purpose.
 *
 * Uses plain JPA (no Lombok) to match the style of your actual User.java
 * - adjust to Lombok if the rest of your entities use it instead.
 */
@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    /** e.g. "DELAY_WARNING", "HIGH_RISK" - kept as String since no Alert
     *  enum was confirmed to exist; switch to an enum type if you have one. */
    @Column(name = "alert_type", nullable = false, length = 50)
    private String alertType;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Alert() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Shipment getShipment() {
        return shipment;
    }

    public void setShipment(Shipment shipment) {
        this.shipment = shipment;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

}
