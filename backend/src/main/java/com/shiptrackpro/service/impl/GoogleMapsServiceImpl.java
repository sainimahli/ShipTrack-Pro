package com.shiptrackpro.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiptrackpro.entity.Address;
import com.shiptrackpro.service.GoogleMapsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class GoogleMapsServiceImpl implements GoogleMapsService {

    @Value("${google.maps.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Static coordinates map for major cities in India to fallback gracefully
    private static final Map<String, double[]> CITY_COORDS = new HashMap<>();

    static {
        CITY_COORDS.put("mumbai", new double[]{19.0760, 72.8777});
        CITY_COORDS.put("delhi", new double[]{28.6139, 77.2090});
        CITY_COORDS.put("new delhi", new double[]{28.6139, 77.2090});
        CITY_COORDS.put("bengaluru", new double[]{12.9716, 77.5946});
        CITY_COORDS.put("bangalore", new double[]{12.9716, 77.5946});
        CITY_COORDS.put("hyderabad", new double[]{17.3850, 78.4867});
        CITY_COORDS.put("pune", new double[]{18.5204, 73.8567});
        CITY_COORDS.put("chennai", new double[]{13.0827, 80.2707});
        CITY_COORDS.put("tambaram", new double[]{12.9249, 80.1240});
        CITY_COORDS.put("thambaram", new double[]{12.9249, 80.1240});
        CITY_COORDS.put("nagpur", new double[]{21.1466, 79.0849});
        CITY_COORDS.put("kurnool", new double[]{15.8281, 78.0373});
        CITY_COORDS.put("lucknow", new double[]{26.8467, 80.9462});
        CITY_COORDS.put("kanpur", new double[]{26.4499, 80.3319});
        CITY_COORDS.put("tiruvannamalai", new double[]{12.2272, 79.0700});
        CITY_COORDS.put("vellore", new double[]{12.9165, 79.1325});
        CITY_COORDS.put("coimbatore", new double[]{11.0168, 76.9558});
        CITY_COORDS.put("madurai", new double[]{9.9252, 78.1198});
        CITY_COORDS.put("trichy", new double[]{10.7905, 78.7047});
        CITY_COORDS.put("tirchy", new double[]{10.7905, 78.7047});
        CITY_COORDS.put("salem", new double[]{11.6643, 78.1460});
        CITY_COORDS.put("pondicherry", new double[]{11.9416, 79.8083});
        CITY_COORDS.put("puducherry", new double[]{11.9416, 79.8083});
        CITY_COORDS.put("tirupati", new double[]{13.6288, 79.4192});
        CITY_COORDS.put("theni", new double[]{10.0104, 77.4768});
        CITY_COORDS.put("erode", new double[]{11.3410, 77.7172});
        CITY_COORDS.put("dindigul", new double[]{10.3673, 77.9803});
        CITY_COORDS.put("tirunelveli", new double[]{8.7139, 77.7567});
        CITY_COORDS.put("thoothukudi", new double[]{8.7642, 78.1348});
        CITY_COORDS.put("tuticorin", new double[]{8.7642, 78.1348});
        CITY_COORDS.put("kanyakumari", new double[]{8.0883, 77.5385});
        CITY_COORDS.put("nagercoil", new double[]{8.1833, 77.4119});
        CITY_COORDS.put("thanjavur", new double[]{10.7870, 79.1378});
        CITY_COORDS.put("kumbakonam", new double[]{10.9602, 79.3845});
        CITY_COORDS.put("namakkal", new double[]{11.2189, 78.1674});
        CITY_COORDS.put("hosur", new double[]{12.7409, 77.8253});
        CITY_COORDS.put("krishnagiri", new double[]{12.5186, 78.2138});
        CITY_COORDS.put("dharmapuri", new double[]{12.1211, 78.1582});
        CITY_COORDS.put("tirupur", new double[]{11.1085, 77.3411});
        CITY_COORDS.put("tiruppur", new double[]{11.1085, 77.3411});
        CITY_COORDS.put("ooty", new double[]{11.4102, 76.6950});
        CITY_COORDS.put("cuddalore", new double[]{11.7480, 79.7714});
        CITY_COORDS.put("chidambaram", new double[]{11.3980, 79.6936});
        CITY_COORDS.put("nagapattinam", new double[]{10.7656, 79.8424});
        CITY_COORDS.put("karaikal", new double[]{10.9254, 79.8380});
        CITY_COORDS.put("sivakasi", new double[]{9.4532, 77.7951});
        CITY_COORDS.put("virudhunagar", new double[]{9.5680, 77.9624});
        CITY_COORDS.put("ramanathapuram", new double[]{9.3639, 78.8395});
        CITY_COORDS.put("sivaganga", new double[]{9.8433, 78.4809});
        CITY_COORDS.put("pudukkottai", new double[]{10.3796, 78.8208});
        CITY_COORDS.put("karaikudi", new double[]{10.0747, 78.7842});
        CITY_COORDS.put("perambalur", new double[]{11.2342, 78.8756});
        CITY_COORDS.put("ariyalur", new double[]{11.1401, 79.0786});
        CITY_COORDS.put("villupuram", new double[]{11.9401, 79.4861});
        CITY_COORDS.put("viluppuram", new double[]{11.9401, 79.4861});
        CITY_COORDS.put("kallakurichi", new double[]{11.7383, 78.9639});
        CITY_COORDS.put("tiruvallur", new double[]{13.1394, 79.9070});
        CITY_COORDS.put("kanchipuram", new double[]{12.8342, 79.7036});
        CITY_COORDS.put("chengalpattu", new double[]{12.6932, 79.9754});
        CITY_COORDS.put("ranipet", new double[]{12.9272, 79.3331});
        CITY_COORDS.put("tirupattur", new double[]{12.4918, 78.5636});
        CITY_COORDS.put("tenkasi", new double[]{8.9591, 77.3146});
        CITY_COORDS.put("mayiladuthurai", new double[]{11.1018, 79.6522});
        CITY_COORDS.put("karur", new double[]{10.9601, 78.0766});
        // Missing database cities
        CITY_COORDS.put("perundurai", new double[]{11.2778, 77.5833});
        CITY_COORDS.put("kundrathur", new double[]{12.9977, 80.0972});
        CITY_COORDS.put("thudupathi", new double[]{11.4102, 77.5856});
        CITY_COORDS.put("vinnavanur", new double[]{10.2742, 77.3694});
        CITY_COORDS.put("chengam", new double[]{12.3003, 78.8018});
        CITY_COORDS.put("malaysia", new double[]{3.1390, 101.6869});
        CITY_COORDS.put("thiruvarur", new double[]{10.7661, 79.6344});
        CITY_COORDS.put("tiruvarur", new double[]{10.7661, 79.6344});
    }

    private Boolean isKeyValidCache = null;

    public GoogleMapsServiceImpl(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean isApiKeyValid() {
        if (isKeyValidCache != null) {
            return isKeyValidCache;
        }

        if (apiKey == null || apiKey.isBlank() || apiKey.startsWith("your-") || apiKey.equals("YOUR_API_KEY")) {
            isKeyValidCache = false;
            return false;
        }

        try {
            String url = "https://maps.googleapis.com/maps/api/geocode/json?address=Chennai&key=" + apiKey;
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root = objectMapper.readTree(response);
            String status = root.path("status").asText();
            if (!"OK".equals(status) && !"ZERO_RESULTS".equals(status)) {
                isKeyValidCache = false;
                log.warn("Google Maps API key validation failed with status: {} (Error: {})", status, root.path("error_message").asText());
                return false;
            }
            
            isKeyValidCache = true;
            return true;
        } catch (Exception e) {
            log.error("Error validating Google Maps API key: {}", e.getMessage());
            // If connection fails, assume true to not block loading dynamically
            return true;
        }
    }

    @Override
    public Address geocodeAddress(Address address) {
        if (address == null) return null;

        // Construct search address
        StringBuilder queryBuilder = new StringBuilder();
        if (address.getLine1() != null) queryBuilder.append(address.getLine1()).append(", ");
        if (address.getCity() != null) queryBuilder.append(address.getCity()).append(", ");
        if (address.getState() != null) queryBuilder.append(address.getState()).append(", ");
        if (address.getCountry() != null) queryBuilder.append(address.getCountry());

        String addressText = queryBuilder.toString().trim();

        if (isApiKeyValid()) {
            try {
                String encodedAddress = URLEncoder.encode(addressText, StandardCharsets.UTF_8);
                String url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + encodedAddress + "&key=" + apiKey;
                String response = restTemplate.getForObject(url, String.class);
                JsonNode root = objectMapper.readTree(response);
                
                if ("OK".equals(root.path("status").asText())) {
                    JsonNode location = root.path("results").get(0).path("geometry").path("location");
                    double lat = location.path("lat").asDouble();
                    double lng = location.path("lng").asDouble();
                    address.setLatitude(lat);
                    address.setLongitude(lng);
                    log.info("Successfully geocoded address '{}' via Google API: {}, {}", addressText, lat, lng);
                    return address;
                } else {
                    log.warn("Google Geocoding failed with status: {}. Falling back.", root.path("status").asText());
                }
            } catch (Exception e) {
                log.error("Google Geocoding error for address '{}': {}. Falling back.", addressText, e.getMessage());
            }
        }

        // Fallback geocoding
        fallbackGeocode(address);
        return address;
    }

    @Override
    public RouteDetails calculateRoute(Double originLat, Double originLng, Double destLat, Double destLng) {
        if (originLat == null || originLng == null || destLat == null || destLng == null) {
            return new RouteDetails(0.0, 0L, "Unknown");
        }

        if (isApiKeyValid()) {
            try {
                String url = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" 
                        + originLat + "," + originLng + "&destinations=" + destLat + "," + destLng + "&key=" + apiKey;
                String response = restTemplate.getForObject(url, String.class);
                JsonNode root = objectMapper.readTree(response);

                if ("OK".equals(root.path("status").asText())) {
                    JsonNode element = root.path("rows").get(0).path("elements").get(0);
                    if ("OK".equals(element.path("status").asText())) {
                        double distanceKm = element.path("distance").path("value").asDouble() / 1000.0;
                        long durationMinutes = Math.round(element.path("duration").path("value").asDouble() / 60.0);
                        String routeName = "Google Maps Route";
                        log.info("Successfully calculated route via Distance Matrix: {} km, {} mins", distanceKm, durationMinutes);
                        return new RouteDetails(distanceKm, durationMinutes, routeName);
                    }
                }
                log.warn("Google Distance Matrix failed with status: {}. Falling back.", root.path("status").asText());
            } catch (Exception e) {
                log.error("Google Distance Matrix error: {}. Falling back.", e.getMessage());
            }
        }

        // Fallback calculations using Haversine formula and speed of 60 km/h
        double distanceKm = calculateHaversineDistance(originLat, originLng, destLat, destLng);
        long durationMinutes = Math.round((distanceKm / 60.0) * 60.0); // 60 km/h average speed
        return new RouteDetails(distanceKm, durationMinutes, "Direct route (Haversine fallback)");
    }

    private void fallbackGeocode(Address address) {
        if (address.getCity() == null) {
            address.setLatitude(13.0827); // Default to Chennai coords
            address.setLongitude(80.2707);
            return;
        }

        String cityKey = address.getCity().toLowerCase().trim();
        double[] coords = CITY_COORDS.get(cityKey);
        if (coords != null) {
            address.setLatitude(coords[0]);
            address.setLongitude(coords[1]);
            log.info("Matched city '{}' to local coordinates dictionary: {}, {}", address.getCity(), coords[0], coords[1]);
            return;
        }

        // Check partial match
        for (Map.Entry<String, double[]> entry : CITY_COORDS.entrySet()) {
            if (cityKey.contains(entry.getKey()) || entry.getKey().contains(cityKey)) {
                address.setLatitude(entry.getValue()[0]);
                address.setLongitude(entry.getValue()[1]);
                log.info("Matched city '{}' partially to local coordinates: {}, {}", address.getCity(), entry.getValue()[0], entry.getValue()[1]);
                return;
            }
        }

        // Hash-based offset fallback to prevent overlap
        int hash = cityKey.hashCode();
        double baseLat = 13.0827;
        double baseLng = 80.2707;
        double latOffset = ((Math.abs(hash) % 200) - 100) / 100.0;
        double lngOffset = ((Math.abs(hash * 31) % 200) - 100) / 100.0;

        address.setLatitude(baseLat + latOffset);
        address.setLongitude(baseLng + lngOffset);
        log.info("Generated hash-based coordinates for city '{}': {}, {}", address.getCity(), address.getLatitude(), address.getLongitude());
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the Earth in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
