package com.shiptrackpro.repository;

import com.shiptrackpro.entity.PodConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PodConfirmationRepository
        extends JpaRepository<PodConfirmation, Long> {

    Optional<PodConfirmation> findByShipmentId(Long shipmentId);

    List<PodConfirmation> findAllByOrderByCreatedAtDesc();
}