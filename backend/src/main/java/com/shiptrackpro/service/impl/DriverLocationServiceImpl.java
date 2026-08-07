package com.shiptrackpro.service.impl;

import com.shiptrackpro.dto.DriverLocationRequest;
import com.shiptrackpro.dto.DriverLocationResponse;
import com.shiptrackpro.entity.DriverLocation;
import com.shiptrackpro.exception.ResourceNotFoundException;
import com.shiptrackpro.repository.DriverLocationRepository;
import com.shiptrackpro.service.DriverLocationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DriverLocationServiceImpl implements DriverLocationService {

    private final DriverLocationRepository driverLocationRepository;

    public DriverLocationServiceImpl(DriverLocationRepository driverLocationRepository) {
        this.driverLocationRepository = driverLocationRepository;
    }

    @Override
    public DriverLocationResponse saveLocation(Long driverId, DriverLocationRequest request) {
        DriverLocation location = new DriverLocation();
        location.setDriverId(driverId);
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());
        location.setLocationName(request.getLocationName());

        return mapToResponse(driverLocationRepository.save(location));
    }

    @Override
    @Transactional(readOnly = true)
    public DriverLocationResponse getLatestLocation(Long driverId) {
        DriverLocation location = driverLocationRepository.findFirstByDriverIdOrderByTimestampDesc(driverId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No location recorded yet for driver with id: " + driverId));
        return mapToResponse(location);
    }

    private DriverLocationResponse mapToResponse(DriverLocation location) {
        return new DriverLocationResponse(
                location.getDriverId(),
                location.getLocationName(),
                location.getLatitude(),
                location.getLongitude(),
                location.getTimestamp()
        );
    }

}
