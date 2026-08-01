package com.shiptrackpro.repository;

import com.shiptrackpro.entity.ProofOfDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProofOfDeliveryRepository extends JpaRepository<ProofOfDelivery, Long> {

    Optional<ProofOfDelivery> findByPodId(Long podId);

    Optional<ProofOfDelivery> findByShipmentId(Long shipmentId);

}