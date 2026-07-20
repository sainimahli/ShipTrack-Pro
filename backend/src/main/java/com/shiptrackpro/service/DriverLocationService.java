package com.shiptrackpro.service;

import com.shiptrackpro.dto.DriverLocationRequest;
import com.shiptrackpro.dto.DriverLocationResponse;

public interface DriverLocationService {

    DriverLocationResponse saveLocation(Long driverId, DriverLocationRequest request);

    /**
     * @throws com.shiptrackpro.exception.ResourceNotFoundException if no location has ever been recorded for this driver
     */
    DriverLocationResponse getLatestLocation(Long driverId);

}
