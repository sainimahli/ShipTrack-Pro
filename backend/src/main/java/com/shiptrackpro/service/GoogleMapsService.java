package com.shiptrackpro.service;

import com.shiptrackpro.entity.Address;

public interface GoogleMapsService {
    
    Address geocodeAddress(Address address);
    
    RouteDetails calculateRoute(Double originLat, Double originLng, Double destLat, Double destLng);

    boolean isApiKeyValid();

    class RouteDetails {
        private final Double distanceKm;
        private final Long durationMinutes;
        private final String routeName;

        public RouteDetails(Double distanceKm, Long durationMinutes, String routeName) {
            this.distanceKm = distanceKm;
            this.durationMinutes = durationMinutes;
            this.routeName = routeName;
        }

        public Double getDistanceKm() { return distanceKm; }
        public Long getDurationMinutes() { return durationMinutes; }
        public String getRouteName() { return routeName; }
    }
}
