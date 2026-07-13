package com.shiptrackpro.service;

import com.shiptrackpro.dto.TrackingLocationResponse;
import com.shiptrackpro.dto.TrackingStatusResponse;
import com.shiptrackpro.dto.TrackingTimelineResponse;
import com.shiptrackpro.dto.UpdateLocationRequest;
import com.shiptrackpro.dto.UpdateTrackingStatusRequest;

public interface TrackingService {

    TrackingStatusResponse getTrackingStatus(String trackingNumber);

    TrackingTimelineResponse getTrackingTimeline(String trackingNumber);

    TrackingLocationResponse getTrackingLocation(String trackingNumber);

    TrackingStatusResponse updateTrackingStatus(UpdateTrackingStatusRequest request);

    TrackingLocationResponse updateLocation(UpdateLocationRequest request);

    void recordShipmentCreated(String trackingNumber);
}