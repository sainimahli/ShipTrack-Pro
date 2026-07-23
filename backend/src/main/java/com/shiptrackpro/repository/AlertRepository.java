package com.shiptrackpro.repository;

import com.shiptrackpro.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByShipment_ShipmentIdOrderByCreatedAtDesc(Long shipmentId);

Optional<Alert> findFirstByShipment_ShipmentIdAndIsReadFalse(Long shipmentId);
}
