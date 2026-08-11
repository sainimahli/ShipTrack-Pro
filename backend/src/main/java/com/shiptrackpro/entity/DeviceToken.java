package com.shiptrackpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

/**
 * Stores a user's registered FCM device token for push notifications.
 * A user may have multiple tokens (multiple devices).
 */
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "device_tokens",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "device_token"}),
       indexes = @Index(name = "idx_device_tokens_user_id", columnList = "user_id"))
public class DeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "device_token", nullable = false, length = 512)
    private String deviceToken;

    /** "android", "ios", "web" */
    @Column(name = "platform", length = 20)
    private String platform;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist  void prePersist()  { createdAt = OffsetDateTime.now(); updatedAt = createdAt; }
    @PreUpdate   void preUpdate()   { updatedAt = OffsetDateTime.now(); }
}
