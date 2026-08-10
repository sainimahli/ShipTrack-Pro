package com.shiptrackpro.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "pod_confirmation_images")
public class PodConfirmationImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "confirmation_image_id")
    private Long confirmationImageId;

    @Column(name = "confirmation_id", nullable = false)
    private Long confirmationId;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;
}