package com.shiptrackpro.service.impl;

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

/**
 * Calculates route distance and estimated travel time between Indian cities.
 *
 * Distance is computed using the Haversine formula on known city coordinates.
 * Estimated travel time assumes an average road speed of 60 km/h.
 * Supports calculation via city names, address IDs, or tracking number.
 */
@Service
public class RouteServiceImpl implements RouteService {

    private final AddressRepository addressRepository;
    private final TrackingEventRepository trackingEventRepository;

    @Autowired
    public RouteServiceImpl(
            @Autowired(required = false) AddressRepository addressRepository,
            @Autowired(required = false) TrackingEventRepository trackingEventRepository) {
        this.addressRepository = addressRepository;
        this.trackingEventRepository = trackingEventRepository;
    }

    /** Average road speed in km/h used for ETA calculation. */
    private static final double AVERAGE_SPEED_KMH = 60.0;

    /** Earth radius in kilometres. */
    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Approximate coordinates (latitude, longitude) for major Indian cities.
     * Keyed by lowercase city name for case-insensitive lookup.
     */
    private static final Map<String, double[]> CITY_COORDINATES = Map.ofEntries(
        Map.entry("mumbai",          new double[]{19.0760,  72.8777}),
        Map.entry("delhi",           new double[]{28.6139,  77.2090}),
        Map.entry("new delhi",       new double[]{28.6139,  77.2090}),
        Map.entry("bangalore",       new double[]{12.9716,  77.5946}),
        Map.entry("bengaluru",       new double[]{12.9716,  77.5946}),
        Map.entry("hyderabad",       new double[]{17.3850,  78.4867}),
        Map.entry("chennai",         new double[]{13.0827,  80.2707}),
        Map.entry("kolkata",         new double[]{22.5726,  88.3639}),
        Map.entry("pune",            new double[]{18.5204,  73.8567}),
        Map.entry("ahmedabad",       new double[]{23.0225,  72.5714}),
        Map.entry("jaipur",          new double[]{26.9124,  75.7873}),
        Map.entry("surat",           new double[]{21.1702,  72.8311}),
        Map.entry("lucknow",         new double[]{26.8467,  80.9462}),
        Map.entry("kanpur",          new double[]{26.4499,  80.3319}),
        Map.entry("nagpur",          new double[]{21.1458,  79.0882}),
        Map.entry("indore",          new double[]{22.7196,  75.8577}),
        Map.entry("thane",           new double[]{19.2183,  72.9781}),
        Map.entry("bhopal",          new double[]{23.2599,  77.4126}),
        Map.entry("visakhapatnam",   new double[]{17.6868,  83.2185}),
        Map.entry("patna",           new double[]{25.5941,  85.1376}),
        Map.entry("vadodara",        new double[]{22.3072,  73.1812}),
        Map.entry("ghaziabad",       new double[]{28.6692,  77.4538}),
        Map.entry("ludhiana",        new double[]{30.9010,  75.8573}),
        Map.entry("agra",            new double[]{27.1767,  78.0081}),
        Map.entry("nashik",          new double[]{19.9975,  73.7898}),
        Map.entry("faridabad",       new double[]{28.4089,  77.3178}),
        Map.entry("meerut",          new double[]{28.9845,  77.7064}),
        Map.entry("rajkot",          new double[]{22.3039,  70.8022}),
        Map.entry("varanasi",        new double[]{25.3176,  82.9739}),
        Map.entry("srinagar",        new double[]{34.0837,  74.7973}),
        Map.entry("aurangabad",      new double[]{19.8762,  75.3433}),
        Map.entry("amritsar",        new double[]{31.6340,  74.8723}),
        Map.entry("coimbatore",      new double[]{11.0168,  76.9558}),
        Map.entry("ranchi",          new double[]{23.3441,  85.3096}),
        Map.entry("jabalpur",        new double[]{23.1815,  79.9864}),
        Map.entry("gwalior",         new double[]{26.2183,  78.1828}),
        Map.entry("vijayawada",      new double[]{16.5062,  80.6480}),
        Map.entry("jodhpur",         new double[]{26.2389,  73.0243}),
        Map.entry("madurai",         new double[]{9.9252,   78.1198}),
        Map.entry("raipur",          new double[]{21.2514,  81.6296}),
        Map.entry("kochi",           new double[]{9.9312,   76.2673}),
        Map.entry("chandigarh",      new double[]{30.7333,  76.7794}),
        Map.entry("guwahati",        new double[]{26.1445,  91.7362}),
        Map.entry("solapur",         new double[]{17.6805,  75.9064}),
        Map.entry("hubli",           new double[]{15.3647,  75.1240}),
        Map.entry("tiruchirappalli", new double[]{10.7905,  78.7047}),
        Map.entry("bareilly",        new double[]{28.3670,  79.4304}),
        Map.entry("mysore",          new double[]{12.2958,  76.6394}),
        Map.entry("mysuru",          new double[]{12.2958,  76.6394}),
        Map.entry("tiruppur",        new double[]{11.1085,  77.3411}),
        Map.entry("gurgaon",         new double[]{28.4595,  77.0266}),
        Map.entry("gurugram",        new double[]{28.4595,  77.0266}),
        Map.entry("aligarh",         new double[]{27.8974,  78.0880}),
        Map.entry("jalandhar",       new double[]{31.3260,  75.5762}),
        Map.entry("bhubaneswar",     new double[]{20.2961,  85.8245}),
        Map.entry("salem",           new double[]{11.6643,  78.1460}),
        Map.entry("warangal",        new double[]{17.9784,  79.5941}),
        Map.entry("mira-bhayandar",  new double[]{19.2952,  72.8544}),
        Map.entry("thiruvananthapuram", new double[]{8.5241, 76.9366}),
        Map.entry("bhiwandi",        new double[]{19.2967,  73.0631}),
        Map.entry("saharanpur",      new double[]{29.9680,  77.5510}),
        Map.entry("guntur",          new double[]{16.3067,  80.4365}),
        Map.entry("amravati",        new double[]{20.9374,  77.7796}),
        Map.entry("bikaner",         new double[]{28.0229,  73.3119}),
        Map.entry("noida",           new double[]{28.5355,  77.3910}),
        Map.entry("jamshedpur",      new double[]{22.8046,  86.2029}),
        Map.entry("bhilai",          new double[]{21.2090,  81.4285}),
        Map.entry("cuttack",         new double[]{20.4625,  85.8830}),
        Map.entry("firozabad",       new double[]{27.1591,  78.3957}),
        Map.entry("kota",            new double[]{25.2138,  75.8648}),
        Map.entry("kolhapur",        new double[]{16.7050,  74.2433}),
        Map.entry("ajmer",           new double[]{26.4499,  74.6399}),
        Map.entry("akola",           new double[]{20.7002,  77.0082}),
        Map.entry("gulbarga",        new double[]{17.3297,  76.8343}),
        Map.entry("jamnagar",        new double[]{22.4707,  70.0577}),
        Map.entry("ujjain",          new double[]{23.1765,  75.7885}),
        Map.entry("loni",            new double[]{28.7500,  77.2900}),
        Map.entry("siliguri",        new double[]{26.7271,  88.3953}),
        Map.entry("jhansi",          new double[]{25.4484,  78.5685}),
        Map.entry("ulhasnagar",      new double[]{19.2183,  73.1558}),
        Map.entry("jammu",           new double[]{32.7266,  74.8570}),
        Map.entry("sangli-miraj",    new double[]{16.8524,  74.5815}),
        Map.entry("mangalore",       new double[]{12.9141,  74.8560}),
        Map.entry("erode",           new double[]{11.3410,  77.7172}),
        Map.entry("belgaum",         new double[]{15.8497,  74.4977}),
        Map.entry("ambattur",        new double[]{13.1143,  80.1548}),
        Map.entry("tirunelveli",     new double[]{8.7139,   77.7567}),
        Map.entry("malegaon",        new double[]{20.5579,  74.5089}),
        Map.entry("gaya",            new double[]{24.7955,  85.0002}),
        Map.entry("jalgaon",         new double[]{21.0077,  75.5626}),
        Map.entry("udaipur",         new double[]{24.5854,  73.7125}),
        Map.entry("maheshtala",      new double[]{22.5100,  88.2500}),
        Map.entry("davanagere",      new double[]{14.4644,  75.9218}),
        Map.entry("kozhikode",       new double[]{11.2588,  75.7804}),
        Map.entry("akbarpur",        new double[]{26.4300,  82.5300}),
        Map.entry("kurnool",         new double[]{15.8281,  78.0373}),
        Map.entry("rajpur sonarpur", new double[]{22.4500,  88.3900}),
        Map.entry("rajahmundry",     new double[]{17.0005,  81.8040}),
        Map.entry("bokaro",          new double[]{23.6693,  86.1511}),
        Map.entry("south dumdum",    new double[]{22.6200,  88.4000}),
        Map.entry("bellary",         new double[]{15.1394,  76.9214}),
        Map.entry("patiala",         new double[]{30.3398,  76.3869}),
        Map.entry("gopalpur",        new double[]{19.2600,  84.9100}),
        Map.entry("agartala",        new double[]{23.8315,  91.2868}),
        Map.entry("bhagalpur",       new double[]{25.2425,  86.9842}),
        Map.entry("muzaffarnagar",   new double[]{29.4727,  77.7085}),
        Map.entry("bhatpara",        new double[]{22.8700,  88.4100}),
        Map.entry("panihati",        new double[]{22.6900,  88.3700}),
        Map.entry("latur",           new double[]{18.4088,  76.5604}),
        Map.entry("dhule",           new double[]{20.9042,  74.7749}),
        Map.entry("rohtak",          new double[]{28.8955,  76.6066}),
        Map.entry("korba",           new double[]{22.3595,  82.7501}),
        Map.entry("bhilwara",        new double[]{25.3407,  74.6313}),
        Map.entry("brahmapur",       new double[]{19.3150,  84.7941}),
        Map.entry("muzaffarpur",     new double[]{26.1209,  85.3647}),
        Map.entry("ahmednagar",      new double[]{19.0952,  74.7496}),
        Map.entry("mathura",         new double[]{27.4924,  77.6737}),
        Map.entry("kollam",          new double[]{8.8932,   76.6141}),
        Map.entry("avadi",           new double[]{13.1149,  80.1000}),
        Map.entry("kadapa",          new double[]{14.4673,  78.8242}),
        Map.entry("anantapur",       new double[]{14.6819,  77.6006}),
        Map.entry("kamarhati",       new double[]{22.6700,  88.3700}),
        Map.entry("bilaspur",        new double[]{22.0797,  82.1409}),
        Map.entry("shahjahanpur",    new double[]{27.8833,  79.9056}),
        Map.entry("bijapur",         new double[]{16.8302,  75.7100}),
        Map.entry("rampur",          new double[]{28.8159,  79.0254}),
        Map.entry("shambhajinagar",  new double[]{19.8762,  75.3433}),
        Map.entry("shimla",          new double[]{31.1048,  77.1734}),
        Map.entry("dehradun",        new double[]{30.3165,  78.0322}),
        Map.entry("haridwar",        new double[]{29.9457,  78.1642}),
        Map.entry("rishikesh",       new double[]{30.0869,  78.2676}),
        Map.entry("nainital",        new double[]{29.3803,  79.4636}),
        Map.entry("port blair",      new double[]{11.6234,  92.7265}),
        Map.entry("panaji",          new double[]{15.4909,  73.8278}),
        Map.entry("imphal",          new double[]{24.8170,  93.9368}),
        Map.entry("shillong",        new double[]{25.5788,  91.8933}),
        Map.entry("aizawl",          new double[]{23.7271,  92.7176}),
        Map.entry("kohima",          new double[]{25.6751,  94.1086}),
        Map.entry("itanagar",        new double[]{27.0844,  93.6053}),
        Map.entry("gangtok",         new double[]{27.3389,  88.6065}),
        Map.entry("dispur",          new double[]{26.1445,  91.7362})
    );

    @Override
    public RouteResponse calculateRoute(RouteRequest request) {
        String destinationCity = resolveCity(request.getDestinationCity(), request.getEffectiveDestinationId(), "Destination");
        String destinationKey = destinationCity.trim().toLowerCase();
        double[] destinationCoords = resolveCoordinates(request.getEffectiveDestinationId(), destinationKey);

        if (destinationCoords == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "City not found in route database: " + destinationCity);
        }

        double[] currentCoords = null;
        String trackingNumber = request.getTrackingNumber();

        if (trackingNumber != null && !trackingNumber.trim().isEmpty() && trackingEventRepository != null) {
            String normalizedTrackingNumber = trackingNumber.trim();
            TrackingEvent latestEvent = trackingEventRepository.findLatestLocationByTrackingNumber(normalizedTrackingNumber)
                    .orElseGet(() -> trackingEventRepository.findFirstByTrackingNumberOrderByUpdatedAtDesc(normalizedTrackingNumber).orElse(null));

            if (latestEvent != null) {
                if (latestEvent.getLatitude() != null && latestEvent.getLongitude() != null) {
                    currentCoords = new double[]{latestEvent.getLatitude(), latestEvent.getLongitude()};
                } else if (latestEvent.getLocationName() != null && !latestEvent.getLocationName().trim().isEmpty()) {
                    currentCoords = CITY_COORDINATES.get(latestEvent.getLocationName().trim().toLowerCase());
                }
            }
        }

        String originCity = null;
        if (request.getOriginCity() != null || request.getEffectiveOriginId() != null) {
            originCity = resolveCity(request.getOriginCity(), request.getEffectiveOriginId(), "Origin");
        }

        if (currentCoords == null) {
            if (originCity == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Origin city or address ID must be provided.");
            }
            String originKey = originCity.trim().toLowerCase();
            currentCoords = resolveCoordinates(request.getEffectiveOriginId(), originKey);
            if (currentCoords == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "City not found in route database: " + originCity);
            }
        } else if (originCity == null) {
            originCity = "Current Location";
        }

        double distanceKm = haversineDistance(
                currentCoords[0], currentCoords[1],
                destinationCoords[0], destinationCoords[1]);

        long estimatedMinutes = Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60);

        RouteResponse response = new RouteResponse();
        response.setOriginCity(originCity.trim());
        response.setDestinationCity(destinationCity.trim());
        response.setOriginId(request.getEffectiveOriginId());
        response.setDestinationId(request.getEffectiveDestinationId());
        response.setRoute(originCity.trim() + " → " + destinationCity.trim());
        response.setDistanceKm(Math.round(distanceKm * 10.0) / 10.0);
        response.setEstimatedMinutes(estimatedMinutes);
        response.setEstimatedTravelTime(formatDuration(estimatedMinutes));
        return response;
    }

    private double[] resolveCoordinates(Long addressId, String cityKey) {
        if (addressId != null && addressRepository != null) {
            Address address = addressRepository.findById(addressId).orElse(null);
            if (address != null && address.getLatitude() != null && address.getLongitude() != null) {
                return new double[]{address.getLatitude().doubleValue(), address.getLongitude().doubleValue()};
            }
        }
        return CITY_COORDINATES.get(cityKey);
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
