package com.shiptrackpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Audit log for significant account and security events.
 * Each record is owned by a user and can only be read by that user
 * (or an administrator).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "account_activities",
       indexes = @Index(name = "idx_account_activity_user_id", columnList = "user_id"))
public class AccountActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /** Owner of this activity record — never nullable. */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * Short action identifier, e.g. "LOGIN_SUCCESS", "SHIPMENT_CREATED".
     * Kept under 100 chars so it can be indexed if needed.
     */
    @Column(name = "action", nullable = false, length = 100)
    private String action;

    /** Human-readable description for display in the profile page. */
    @Column(name = "description", length = 500)
    private String description;

    /** Whether the action succeeded (true) or failed (false). */
    @Column(name = "success", nullable = false)
    private boolean success;

    /** IP address of the client, when available. May be null. */
    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    /** When the event occurred. */
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
