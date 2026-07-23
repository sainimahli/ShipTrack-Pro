package com.shiptrackpro.repository;

import com.shiptrackpro.entity.DriverLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DriverLocationRepository extends JpaRepository<DriverLocation, Long> {

    Optional<DriverLocation> findFirstByDriverIdOrderByTimestampDesc(Long driverId);

}
