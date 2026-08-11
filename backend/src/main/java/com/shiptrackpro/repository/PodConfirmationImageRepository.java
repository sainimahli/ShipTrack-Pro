package com.shiptrackpro.repository;

import com.shiptrackpro.entity.PodConfirmationImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PodConfirmationImageRepository
        extends JpaRepository<PodConfirmationImage, Long> {

    List<PodConfirmationImage> findByConfirmationId(Long confirmationId);
}