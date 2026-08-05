package com.shiptrackpro.service.impl;

import com.shiptrackpro.entity.DriverLocation;
import com.shiptrackpro.repository.DriverLocationRepository;
import com.shiptrackpro.dto.RouteRequest;
import com.shiptrackpro.dto.RouteResponse;
import com.shiptrackpro.service.RouteService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


import com.shiptrackpro.entity.Address;
import com.shiptrackpro.entity.TrackingEvent;
import com.shiptrackpro.repository.AddressRepository;
import com.shiptrackpro.repository.TrackingEventRepository;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Calculates route distance and estimated travel time between Indian cities.
 *
 * Distance is computed using the Haversine formula on known city coordinates or Google Maps Geocoding API.
 * Estimated travel time assumes an average road speed of 60 km/h.
 * Supports calculation via city names, address IDs, or tracking number.
 */
@Service
public class RouteServiceImpl implements RouteService {

    private final AddressRepository addressRepository;
    private final TrackingEventRepository trackingEventRepository;
    private final DriverLocationRepository driverLocationRepository;
    private final String googleMapsApiKey;
    private final double[] defaultCenter;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RouteServiceImpl(
            AddressRepository addressRepository,
            TrackingEventRepository trackingEventRepository,
            DriverLocationRepository driverLocationRepository) {
        this(addressRepository, trackingEventRepository,driverLocationRepository, null, "19.0760,72.8777");
    }

    @Autowired
    public RouteServiceImpl(
            @Autowired(required = false) AddressRepository addressRepository,
            @Autowired(required = false) TrackingEventRepository trackingEventRepository,
            @Autowired(required = false) DriverLocationRepository driverLocationRepository,

            @Value("${google.maps.api-key:AIzaSyAEqs7_2CT49g297KuQ86TBWgx1UP-g434}") String googleMapsApiKey,
            @Value("${google.maps.default-center:19.0760,72.8777}") String defaultCenterStr) {
        this.addressRepository = addressRepository;
        this.trackingEventRepository = trackingEventRepository;
        this.driverLocationRepository = driverLocationRepository;
        this.googleMapsApiKey = googleMapsApiKey;
        
        double[] center = new double[]{19.0760, 72.8777};
        if (defaultCenterStr != null && defaultCenterStr.contains(",")) {
            try {
                String[] parts = defaultCenterStr.split(",");
                center = new double[]{Double.parseDouble(parts[0].trim()), Double.parseDouble(parts[1].trim())};
            } catch (Exception ignored) {}
        }
        this.defaultCenter = center;
    }

    /** Average road speed in km/h used for ETA calculation. */
    private static final double AVERAGE_SPEED_KMH = 60.0;

    /** Earth radius in kilometres. */
    private static final double EARTH_RADIUS_KM = 6371.0;

    @Override
    public RouteResponse calculateRoute(RouteRequest request) {
        if (request.getDestinationLatitude() == null || request.getDestinationLongitude() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Destination latitude and longitude must be provided.");
        }

        double[] destinationCoords = new double[]{request.getDestinationLatitude(), request.getDestinationLongitude()};
        double[] currentCoords = null;

        String trackingNumber = request.getTrackingNumber();
        if (trackingNumber != null && !trackingNumber.trim().isEmpty() && trackingEventRepository != null) {
            String normalizedTrackingNumber = trackingNumber.trim();
            TrackingEvent latestEvent = trackingEventRepository.findLatestLocationByTrackingNumber(normalizedTrackingNumber)
                    .orElseGet(() -> trackingEventRepository.findFirstByTrackingNumberOrderByUpdatedAtDesc(normalizedTrackingNumber).orElse(null));

            if (latestEvent != null && hasValidCoordinates(latestEvent.getLatitude(), latestEvent.getLongitude())) {
                currentCoords = new double[]{latestEvent.getLatitude(), latestEvent.getLongitude()};
            }
        }

        // Second preference: Driver Location table
        if (currentCoords == null
                && request.getDriverId() != null
                && driverLocationRepository != null) {

            DriverLocation driverLocation = driverLocationRepository
                    .findFirstByDriverIdOrderByTimestampDesc(request.getDriverId())
                    .orElse(null);

            if (driverLocation != null) {
                currentCoords = new double[]{
                        driverLocation.getLatitude(),
                        driverLocation.getLongitude()
                };
            }
        }

// Third preference: Origin coordinates from request
        if (currentCoords == null
                && request.getOriginLatitude() != null
                && request.getOriginLongitude() != null) {

            currentCoords = new double[]{
                    request.getOriginLatitude(),
                    request.getOriginLongitude()
            };
        }

        if (currentCoords == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Driver location not found. Please update the driver's location first."
            );
        }

        double distanceKm = haversineDistance(
                currentCoords[0], currentCoords[1],
                destinationCoords[0], destinationCoords[1]);

        long estimatedMinutes = Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60);

        RouteResponse response = new RouteResponse();
        response.setRoute(currentCoords[0] + "," + currentCoords[1] + " → " + destinationCoords[0] + "," + destinationCoords[1]);
        response.setDistanceKm(Math.round(distanceKm * 10.0) / 10.0);
        response.setEstimatedMinutes(estimatedMinutes);
        response.setEstimatedTravelTime(formatDuration(estimatedMinutes));
        response.setOriginCoords(currentCoords);
        response.setDestinationCoords(destinationCoords);
        return response;
    }

    private double[] resolveCoordinates(Long addressId, String cityKey) {
        if (addressId != null && addressRepository != null) {
            Address address = addressRepository.findById(addressId).orElse(null);
            if (address != null && address.getLatitude() != null && address.getLongitude() != null) {
                return new double[]{address.getLatitude().doubleValue(), address.getLongitude().doubleValue()};
            }
        }

        // Dynamically fetch coordinates via Google Maps Geocoding API
        if (googleMapsApiKey != null && !googleMapsApiKey.isBlank() && cityKey != null && !cityKey.isBlank()) {
            try {
                String url = "https://maps.googleapis.com/maps/api/geocode/json?address="
                        + java.net.URLEncoder.encode(cityKey, java.nio.charset.StandardCharsets.UTF_8)
                        + "&key=" + googleMapsApiKey;
                String jsonResponse = restTemplate.getForObject(url, String.class);
                if (jsonResponse != null) {
                    JsonNode root = objectMapper.readTree(jsonResponse);
                    if ("OK".equals(root.path("status").asText()) && root.path("results").size() > 0) {
                        JsonNode location = root.path("results").get(0).path("geometry").path("location");
                        double lat = location.path("lat").asDouble();
                        double lng = location.path("lng").asDouble();
                        return new double[]{lat, lng};
                    }
                }
            } catch (Exception e) {
                // Fallback to defaultCenter on network failure
            }
        }

        return defaultCenter;
    }

    private boolean hasValidCoordinates(Double latitude, Double longitude) {
        return latitude != null && longitude != null
                && latitude >= -90 && latitude <= 90
                && longitude >= -180 && longitude <= 180
                && !(latitude == 0.0 && longitude == 0.0);
    }

    private String resolveCity(String cityName, Long addressId, String locationType) {
        if (cityName != null && !cityName.trim().isEmpty()) {
            return cityName.trim();
        }
        if (addressId != null) {
            if (addressRepository != null) {
                Address address = addressRepository.findById(addressId).orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.BAD_REQUEST, locationType + " address ID not found: " + addressId));
                if (address.getCity() != null && !address.getCity().trim().isEmpty()) {
                    return address.getCity().trim();
                }
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, locationType + " address resolution unavailable.");
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, locationType + " city or address ID must be provided.");
    }

    /**
     * Haversine formula — returns great-circle distance in kilometres.
     */
    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private String formatDuration(long totalMinutes) {
        long hours = totalMinutes / 60;
        long minutes = totalMinutes % 60;
        if (hours == 0) {
            return minutes + " min";
        }
        if (minutes == 0) {
            return hours + " hr";
        }
        return hours + " hr " + minutes + " min";
    }
}
