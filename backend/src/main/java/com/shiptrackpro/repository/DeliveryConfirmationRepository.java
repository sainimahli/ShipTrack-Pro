package com.shiptrackpro.repository;

import com.shiptrackpro.entity.DeliveryConfirmation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeliveryConfirmationRepository extends JpaRepository<DeliveryConfirmation, Long> {

    Optional<DeliveryConfirmation> findByShipment_ShipmentId(Long shipmentId);

    boolean existsByShipment_ShipmentId(Long shipmentId);

}


