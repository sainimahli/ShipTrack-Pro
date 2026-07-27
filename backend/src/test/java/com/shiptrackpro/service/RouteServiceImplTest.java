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
    void calculateRoute_Option1_CityNamesOnly() {
        RouteRequest request = new RouteRequest();
        request.setOriginCity("Mumbai");
        request.setDestinationCity("Delhi");

        RouteResponse response = routeService.calculateRoute(request);

        assertNotNull(response);
        assertEquals("Mumbai", response.getOriginCity());
        assertEquals("Delhi", response.getDestinationCity());
        assertTrue(response.getDistanceKm() > 0);
    }

    @Test
    void calculateRoute_Option2_AddressIds() {
        Address originAddress = Address.builder().addressId(1L).city("Mumbai").build();
        Address destAddress = Address.builder().addressId(2L).city("Delhi").build();

        when(addressRepository.findById(1L)).thenReturn(Optional.of(originAddress));
        when(addressRepository.findById(2L)).thenReturn(Optional.of(destAddress));

        RouteRequest request = new RouteRequest();
        request.setOriginAddressId(1L);
        request.setDestinationAddressId(2L);

        RouteResponse response = routeService.calculateRoute(request);

        assertNotNull(response);
        assertEquals("Mumbai", response.getOriginCity());
        assertEquals("Delhi", response.getDestinationCity());
        assertEquals(1L, response.getOriginAddressId());
        assertEquals(2L, response.getDestinationAddressId());
    }

    @Test
    void calculateRoute_Option3_OriginDestinationIds() {
        Address originAddress = Address.builder().addressId(10L).city("Bengaluru").build();
        Address destAddress = Address.builder().addressId(20L).city("Hyderabad").build();

        when(addressRepository.findById(10L)).thenReturn(Optional.of(originAddress));
        when(addressRepository.findById(20L)).thenReturn(Optional.of(destAddress));

        RouteRequest request = new RouteRequest();
        request.setOriginId(10L);
        request.setDestinationId(20L);

        RouteResponse response = routeService.calculateRoute(request);

        assertNotNull(response);
        assertEquals("Bengaluru", response.getOriginCity());
        assertEquals("Hyderabad", response.getDestinationCity());
        assertEquals(10L, response.getOriginId());
        assertEquals(20L, response.getDestinationId());
    }

    @Test
    void calculateRoute_WithTrackingNumber_CalculatesRemainingDistance() {
        Address originAddress = Address.builder().addressId(1L).city("Mumbai").build();
        Address destAddress = Address.builder().addressId(2L).city("Delhi").build();

        when(addressRepository.findById(1L)).thenReturn(Optional.of(originAddress));
        when(addressRepository.findById(2L)).thenReturn(Optional.of(destAddress));

        com.shiptrackpro.entity.TrackingEvent event = new com.shiptrackpro.entity.TrackingEvent();
        event.setLocationName("Pune"); // Pune is closer to Delhi than Mumbai is

        when(trackingEventRepository.findLatestLocationByTrackingNumber("ST123456"))
                .thenReturn(Optional.of(event));

        RouteRequest fullRequest = new RouteRequest();
        fullRequest.setOriginId(1L);
        fullRequest.setDestinationId(2L);
        RouteResponse fullResponse = routeService.calculateRoute(fullRequest);

        RouteRequest trackingRequest = new RouteRequest();
        trackingRequest.setTrackingNumber("ST123456");
        trackingRequest.setOriginId(1L);
        trackingRequest.setDestinationId(2L);
        RouteResponse trackingResponse = routeService.calculateRoute(trackingRequest);

        assertNotNull(trackingResponse);
        assertEquals("Mumbai", trackingResponse.getOriginCity());
        assertEquals("Delhi", trackingResponse.getDestinationCity());
        assertTrue(trackingResponse.getDistanceKm() < fullResponse.getDistanceKm());
    }
}
