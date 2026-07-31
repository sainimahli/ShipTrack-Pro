package com.shiptrackpro.repository;

import com.shiptrackpro.entity.ProofOfDeliveryImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProofOfDeliveryImageRepository extends JpaRepository<ProofOfDeliveryImage, Long> {

    List<ProofOfDeliveryImage> findByPodId(Long podId);

}