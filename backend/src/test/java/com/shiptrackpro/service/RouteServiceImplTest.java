package com.shiptrackpro.service;

import com.shiptrackpro.dto.RouteRequest;
import com.shiptrackpro.dto.RouteResponse;
import com.shiptrackpro.entity.Address;
import com.shiptrackpro.repository.AddressRepository;
import com.shiptrackpro.service.impl.RouteServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RouteServiceImplTest {

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private com.shiptrackpro.repository.TrackingEventRepository trackingEventRepository;

    private RouteServiceImpl routeService;

    @BeforeEach
    void setUp() {
        routeService = new RouteServiceImpl(addressRepository, trackingEventRepository);
    }

    @Test
    void calculateRoute_WithCoordinates() {
        RouteRequest request = new RouteRequest(19.0760, 72.8777, 28.6139, 77.2090);

        RouteResponse response = routeService.calculateRoute(request);

        assertNotNull(response);
        assertTrue(response.getDistanceKm() > 0);
        assertNotNull(response.getOriginCoords());
        assertNotNull(response.getDestinationCoords());
        assertEquals(19.0760, response.getOriginCoords()[0]);
        assertEquals(72.8777, response.getOriginCoords()[1]);
        assertEquals(28.6139, response.getDestinationCoords()[0]);
        assertEquals(77.2090, response.getDestinationCoords()[1]);
    }

    @Test
    void calculateRoute_WithTrackingNumber_CalculatesRemainingDistance() {
        com.shiptrackpro.entity.TrackingEvent event = new com.shiptrackpro.entity.TrackingEvent();
        event.setLatitude(18.5204);
        event.setLongitude(73.8567);

        when(trackingEventRepository.findLatestLocationByTrackingNumber("ST123456"))
                .thenReturn(Optional.of(event));

        RouteRequest fullRequest = new RouteRequest(19.0760, 72.8777, 28.6139, 77.2090);
        RouteResponse fullResponse = routeService.calculateRoute(fullRequest);

        RouteRequest trackingRequest = new RouteRequest();
        trackingRequest.setTrackingNumber("ST123456");
        trackingRequest.setOriginLatitude(19.0760);
        trackingRequest.setOriginLongitude(72.8777);
        trackingRequest.setDestinationLatitude(28.6139);
        trackingRequest.setDestinationLongitude(77.2090);
        RouteResponse trackingResponse = routeService.calculateRoute(trackingRequest);

        assertNotNull(trackingResponse);
        assertTrue(trackingResponse.getDistanceKm() < fullResponse.getDistanceKm());
    }
}
