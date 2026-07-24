import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ShipmentContext } from "../context/shipments";
import { AuthContext } from "../context/auth";
import { getDeliveryForecast, getMapConfig, updateTrackingLocation, updateTrackingStatus } from "../services/api";
import { loadGoogleMaps } from "../services/mapsLoader";

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const forecastByStatus = {
  Created: { remaining: "1 day", risk: "ON TRACK" },
  "Picked Up": { remaining: "16 hours", risk: "ON TRACK" },
  "In Transit": { remaining: "8 hours", risk: "ON TRACK" },
  "Out for Delivery": { remaining: "2 hours", risk: "ON TRACK" },
  Delivered: { remaining: "Delivered", risk: "DELIVERED" },
  "Failed Delivery": { remaining: "Delivery needs attention", risk: "HIGH RISK" },
  Cancelled: { remaining: "Cancelled", risk: "STOPPED" },
  Rejected: { remaining: "Rejected", risk: "STOPPED" },
};

function getForecast(shipment) {
  const forecast = forecastByStatus[shipment.status] || { remaining: "Under review", risk: "WATCH" };
  const isDelayed = shipment.status === "Failed Delivery";
  return {
    ...forecast,
    eta: shipment.eta || "Calculating ETA",
    message: isDelayed
      ? "A delivery exception was recorded. Operations should review the route and contact the receiver."
      : shipment.status === "Delivered"
        ? "Delivery is complete and the final tracking update has been recorded."
        : `The shipment is ${shipment.status.toLowerCase()} and is forecast to reach its destination on schedule.`,
  };
}

const locationCoords = {
  mumbai: { lat: 19.0760, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  "new delhi": { lat: 28.6139, lng: 77.2090 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  pune: { lat: 18.5204, lng: 73.8567 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  thambaram: { lat: 12.9249, lng: 80.1240 },
  tambaram: { lat: 12.9249, lng: 80.1240 },
  nagpur: { lat: 21.1466, lng: 79.0849 },
  kurnool: { lat: 15.8281, lng: 78.0373 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  tiruvannamalai: { lat: 12.2272, lng: 79.0700 },
  vellore: { lat: 12.9165, lng: 79.1325 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  tirchy: { lat: 10.7905, lng: 78.7047 },
  salem: { lat: 11.6643, lng: 78.1460 },
  pondicherry: { lat: 11.9416, lng: 79.8083 },
  puducherry: { lat: 11.9416, lng: 79.8083 },
  tirupati: { lat: 13.6288, lng: 79.4192 },
  // Tamil Nadu additional major cities
  theni: { lat: 10.0104, lng: 77.4768 },
  erode: { lat: 11.3410, lng: 77.7172 },
  dindigul: { lat: 10.3673, lng: 77.9803 },
  tirunelveli: { lat: 8.7139, lng: 77.7567 },
  thoothukudi: { lat: 8.7642, lng: 78.1348 },
  tuticorin: { lat: 8.7642, lng: 78.1348 },
  kanyakumari: { lat: 8.0883, lng: 77.5385 },
  nagercoil: { lat: 8.1833, lng: 77.4119 },
  thanjavur: { lat: 10.7870, lng: 79.1378 },
  kumbakonam: { lat: 10.9602, lng: 79.3845 },
  namakkal: { lat: 11.2189, lng: 78.1674 },
  hosur: { lat: 12.7409, lng: 77.8253 },
  krishnagiri: { lat: 12.5186, lng: 78.2138 },
  dharmapuri: { lat: 12.1211, lng: 78.1582 },
  tirupur: { lat: 11.1085, lng: 77.3411 },
  tiruppur: { lat: 11.1085, lng: 77.3411 },
  ooty: { lat: 11.4102, lng: 76.6950 },
  cuddalore: { lat: 11.7480, lng: 79.7714 },
  chidambaram: { lat: 11.3980, lng: 79.6936 },
  nagapattinam: { lat: 10.7656, lng: 79.8424 },
  karaikal: { lat: 10.9254, lng: 79.8380 },
  sivakasi: { lat: 9.4532, lng: 77.7951 },
  virudhunagar: { lat: 9.5680, lng: 77.9624 },
  ramanathapuram: { lat: 9.3639, lng: 78.8395 },
  sivaganga: { lat: 9.8433, lng: 78.4809 },
  pudukkottai: { lat: 10.3796, lng: 78.8208 },
  karaikudi: { lat: 10.0747, lng: 78.7842 },
  perambalur: { lat: 11.2342, lng: 78.8756 },
  ariyalur: { lat: 11.1401, lng: 79.0786 },
  villupuram: { lat: 11.9401, lng: 79.4861 },
  viluppuram: { lat: 11.9401, lng: 79.4861 },
  kallakurichi: { lat: 11.7383, lng: 78.9639 },
  tiruvallur: { lat: 13.1394, lng: 79.9070 },
  kanchipuram: { lat: 12.8342, lng: 79.7036 },
  chengalpattu: { lat: 12.6932, lng: 79.9754 },
  ranipet: { lat: 12.9272, lng: 79.3331 },
  tirupattur: { lat: 12.4918, lng: 78.5636 },
  tenkasi: { lat: 8.9591, lng: 77.3146 },
  mayiladuthurai: { lat: 11.1018, lng: 79.6522 },
  karur: { lat: 10.9601, lng: 78.0766 },
};

function getCoords(location) {
  if (!location) return { lat: 13.0827, lng: 80.2707 };
  const key = location.toLowerCase().trim();
  if (locationCoords[key]) {
    return locationCoords[key];
  }
  for (const [name, coords] of Object.entries(locationCoords)) {
    if (key.includes(name) || name.includes(key)) {
      return coords;
    }
  }

  // Stable hash offset fallback to prevent overlapping routes for unrecognized cities
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const baseLat = 13.0827;
  const baseLng = 80.2707;
  const latOffset = ((Math.abs(hash) % 200) - 100) / 100; // -1.0 to +1.0 degree
  const lngOffset = ((Math.abs(hash * 31) % 200) - 100) / 100; // -1.0 to +1.0 degree

  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset
  };
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function LiveTrackingMap({ shipment, mapId = "main", onRouteCalculated, getCoords: resolveCoords }) {
  const getCoordsVal = resolveCoords || getCoords;
  const [mapProvider, setMapProvider] = useState("loading");
  const [googleInstance, setGoogleInstance] = useState(null);
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    let timeoutId = setTimeout(() => {
      console.warn("Google Maps load timed out, falling back to Leaflet.");
      setMapProvider("leaflet");
    }, 3500);

    loadGoogleMaps()
      .then((google) => {
        clearTimeout(timeoutId);
        setGoogleInstance(google);
        setMapProvider("google");
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("Google Maps failed to load inside LiveTrackingMap:", err);
        setMapProvider("leaflet");
      });

    return () => clearTimeout(timeoutId);
  }, []);

  const points = useMemo(() => {
    if (!shipment) return [];

    const senderCoords = getCoordsVal(shipment.senderCity);
    const resolvedPoints = [{
      lat: senderCoords.lat,
      lng: senderCoords.lng,
      label: `Origin: ${shipment.senderCity}`,
      isOrigin: true
    }];

    if (shipment.history && shipment.history.length > 0) {
      shipment.history.forEach((event, idx) => {
        const coords = event.latitude != null && event.longitude != null
          ? { lat: Number(event.latitude), lng: Number(event.longitude) }
          : getCoordsVal(event.location);

        const prev = resolvedPoints[resolvedPoints.length - 1];
        if (prev.lat !== coords.lat || prev.lng !== coords.lng) {
          resolvedPoints.push({
            lat: coords.lat,
            lng: coords.lng,
            label: `${event.status} at ${event.location}`,
            isCheckpoint: true,
            isLatest: idx === shipment.history.length - 1
          });
        } else if (idx === shipment.history.length - 1) {
          prev.isLatest = true;
          prev.label = `${event.status} at ${event.location}`;
        }
      });
    }

    const receiverCoords = getCoordsVal(shipment.receiverCity);
    const lastPoint = resolvedPoints[resolvedPoints.length - 1];
    if (lastPoint.lat !== receiverCoords.lat || lastPoint.lng !== receiverCoords.lng) {
      resolvedPoints.push({
        lat: receiverCoords.lat,
        lng: receiverCoords.lng,
        label: `Destination: ${shipment.receiverCity}`,
        isDestination: true
      });
    }

    return resolvedPoints;
  }, [shipment, getCoordsVal]);

  useEffect(() => {
    if (mapProvider !== "google" || !googleInstance || !shipment) return;

    const containerId = `leaflet-live-map-${shipment.trackingNumber}-${mapId}`;
    const container = document.getElementById(containerId);
    if (!container) return;

    const google = googleInstance;
    const origin = getCoordsVal(shipment.senderCity);
    const destination = getCoordsVal(shipment.receiverCity);

    const map = new google.maps.Map(container, {
      center: origin,
      zoom: 6,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#2563eb",
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });

    const markers = [];

    directionsService.route(
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
          if (onRouteCalculated && result.routes[0]?.legs[0]) {
            const leg = result.routes[0].legs[0];
            onRouteCalculated({
              distance: leg.distance.text,
              duration: leg.duration.text
            });
          }
        } else {
          console.warn("Google Directions Request failed, rendering straight fallback polyline:", status);
          if (onRouteCalculated) {
            const dist = calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
            const formattedDistance = `${Math.round(dist)} km (straight line)`;
            const hours = dist / 60;
            const h = Math.floor(hours);
            const m = Math.round((hours - h) * 60);
            const formattedDuration = `${h} hrs ${m} mins`;
            onRouteCalculated({
              distance: formattedDistance,
              duration: formattedDuration
            });
          }
          const fallbackPath = new google.maps.Polyline({
            path: points.map(p => ({ lat: p.lat, lng: p.lng })),
            geodesic: true,
            strokeColor: "#2563eb",
            strokeOpacity: 0.7,
            strokeWeight: 4,
            map: map
          });
          markers.push(fallbackPath);

          const bounds = new google.maps.LatLngBounds();
          points.forEach(p => bounds.extend(new google.maps.LatLng(p.lat, p.lng)));
          map.fitBounds(bounds);
        }
      }
    );
    points.forEach((point) => {
      let iconUrl = "https://maps.google.com/mapfiles/ms/icons/grey.png";
      if (point.isOrigin) {
        iconUrl = "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
      } else if (point.isDestination) {
        iconUrl = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
      } else if (point.isLatest) {
        iconUrl = {
          url: "https://cdn-icons-png.flaticon.com/512/750/750953.png",
          scaledSize: new google.maps.Size(32, 32),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(16, 16)
        };
      }

      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: map,
        title: point.label,
        icon: iconUrl
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="font-family: sans-serif; font-size: 13px;"><b>${point.label}</b></div>`
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      if (point.isLatest) {
        infoWindow.open(map, marker);
      }

      markers.push(marker);
    });

    return () => {
      markers.forEach(m => m.setMap(null));
      directionsRenderer.setMap(null);
      trafficLayer.setMap(null);
    };
  }, [mapProvider, googleInstance, shipment, points, mapId]);

  useEffect(() => {
    if (mapProvider !== "leaflet") return;
    if (window.L) {
      setLeafletReady(true);
      return;
    }

    const cssExists = document.getElementById("leaflet-css");
    if (!cssExists) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.id = "leaflet-css";
      document.head.appendChild(link);
    }

    const jsExists = document.getElementById("leaflet-js");
    if (!jsExists) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.id = "leaflet-js";
      script.onload = () => setLeafletReady(true);
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          setLeafletReady(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [mapProvider]);

  useEffect(() => {
    if (mapProvider !== "leaflet" || !leafletReady || !window.L || !shipment) return;

    const containerId = `leaflet-live-map-${shipment.trackingNumber}-${mapId}`;
    const container = document.getElementById(containerId);
    if (!container) return;

    const L = window.L;
    const origin = getCoordsVal(shipment.senderCity);
    const destination = getCoordsVal(shipment.receiverCity);
    
    if (onRouteCalculated) {
      const dist = calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      const formattedDistance = `${Math.round(dist)} km (straight line)`;
      const hours = dist / 60;
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      const formattedDuration = `${h} hrs ${m} mins`;
      onRouteCalculated({
        distance: formattedDistance,
        duration: formattedDuration
      });
    }

    const mapCenter = points.length > 0
      ? { lat: points[points.length - 1].lat, lng: points[points.length - 1].lng }
      : { lat: 12.9249, lng: 80.1240 };

    const map = L.map(containerId, {
      zoomControl: true,
      attributionControl: false
    }).setView([mapCenter.lat, mapCenter.lng], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const createCustomIcon = (color, isLatest) => {
      return L.divIcon({
        className: 'custom-map-marker',
        html: `<div class="marker-pin" style="background-color: ${color}; ${isLatest ? 'box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.4); animation: pulse-marker 1.5s infinite;' : ''}"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });
    };

    const pathCoords = points.map(p => [p.lat, p.lng]);
    if (pathCoords.length > 1) {
      L.polyline(pathCoords, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.7,
        dashArray: '5, 10'
      }).addTo(map);
    }

    points.forEach(point => {
      let color = '#64748b';
      if (point.isOrigin) color = '#10b981';
      if (point.isDestination) color = '#ef4444';
      if (point.isLatest) color = '#2563eb';

      const marker = L.marker([point.lat, point.lng], {
        icon: createCustomIcon(color, point.isLatest)
      }).addTo(map);

      marker.bindPopup(`<b>${point.label}</b>`);

      if (point.isLatest) {
        marker.openPopup();
      }
    });

    if (pathCoords.length > 1) {
      map.fitBounds(L.latLngBounds(pathCoords), { padding: [40, 40] });
    }

    return () => {
      map.remove();
    };
  }, [mapProvider, leafletReady, shipment, points, mapId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 350 }}>
      <div 
        id={`leaflet-live-map-${shipment.trackingNumber}-${mapId}`} 
        style={{ width: '100%', height: '100%', minHeight: 350, borderRadius: 12, border: '1px solid #e2e8f0' }} 
      />
      {mapProvider === "loading" && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 12 }}>
          <p className="subtle">Loading live tracking map...</p>
        </div>
      )}
    </div>
  );
}

function StatusStepper({ currentStatus }) {
  const steps = [
    { key: "Created", label: "Created" },
    { key: "Picked Up", label: "Picked Up" },
    { key: "In Transit", label: "In Transit" },
    { key: "Out for Delivery", label: "Out for Delivery" },
    { key: "Delivered", label: "Delivered" }
  ];

  const statusIndexMap = {
    "Pending Approval": -1,
    "Rejected": -1,
    "Created": 0,
    "Picked Up": 1,
    "In Transit": 2,
    "Out for Delivery": 3,
    "Delivered": 4,
    "Failed Delivery": 3,
    "Cancelled": -1
  };

  const currentIndex = statusIndexMap[currentStatus] ?? 0;

  return (
    <div className="status-stepper">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;
        const isPending = idx > currentIndex;
        
        let stepClass = "step-pending";
        if (isCompleted) stepClass = "step-completed";
        if (isActive) stepClass = "step-active";

        return (
          <div key={step.key} className={`step-item ${stepClass}`}>
            <div className="step-node-container">
              <div className="step-line" style={{ display: idx === 0 ? 'none' : 'block' }} />
              <div className="step-node">
                {isCompleted ? (
                  <svg className="step-icon" viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="step-number">{idx + 1}</span>
                )}
              </div>
            </div>
            <div className="step-label">
              <span className="step-title">{step.label}</span>
              {isActive && <span className="step-badge">Active</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrackShipment() {
  const { shipments, fetchShipments } = useContext(ShipmentContext);
  const { auth } = useContext(AuthContext);
  const location = useLocation();
  const routeStateTrackingNumber = location.state?.trackingNumber;

  const [trackingNumber, setTrackingNumber] = useState(routeStateTrackingNumber || shipments[0]?.trackingNumber || "");
  const [submittedTracking, setSubmittedTracking] = useState(routeStateTrackingNumber || shipments[0]?.trackingNumber || "");
  const [lastCheckedAt, setLastCheckedAt] = useState(() => new Date());
  const [serverForecast, setServerForecast] = useState(null);
  const [mapConfig, setMapConfig] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [geocodedCoords, setGeocodedCoords] = useState({});

  // Auto-populate default tracking number when shipments load or route state changes
  useEffect(() => {
    if (routeStateTrackingNumber) {
      setTrackingNumber(routeStateTrackingNumber);
      setSubmittedTracking(routeStateTrackingNumber);
    } else if (shipments.length > 0 && !submittedTracking) {
      setTrackingNumber(shipments[0].trackingNumber);
      setSubmittedTracking(shipments[0].trackingNumber);
    }
  }, [shipments, submittedTracking, routeStateTrackingNumber]);

  const getCoords = useCallback((location) => {
    if (!location) return { lat: 13.0827, lng: 80.2707 };
    const key = location.toLowerCase().trim();
    if (locationCoords[key]) {
      return locationCoords[key];
    }
    if (geocodedCoords[key]) {
      return geocodedCoords[key];
    }
    for (const [name, coords] of Object.entries(geocodedCoords)) {
      if (key.includes(name) || name.includes(key)) {
        return coords;
      }
    }
    for (const [name, coords] of Object.entries(locationCoords)) {
      if (key.includes(name) || name.includes(key)) {
        return coords;
      }
    }

    // Stable hash offset fallback to prevent overlapping routes for unrecognized cities
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const baseLat = 13.0827;
    const baseLng = 80.2707;
    const latOffset = ((Math.abs(hash) % 200) - 100) / 100; // -1.0 to +1.0 degree
    const lngOffset = ((Math.abs(hash * 31) % 200) - 100) / 100; // -1.0 to +1.0 degree

    return {
      lat: baseLat + latOffset,
      lng: baseLng + lngOffset
    };
  }, [geocodedCoords]);

  // Simulator state variables
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgressMsg, setSimProgressMsg] = useState("");
  const [simErrorMsg, setSimErrorMsg] = useState("");

  const [routeDetails, setRouteDetails] = useState({ distance: "", duration: "" });
  const handleRouteCalculated = useCallback((details) => {
    setRouteDetails(details);
  }, []);

  const userRole = auth?.user?.role;
  const isOperatorOrAdmin = ["LOGISTICS_OPERATOR", "ADMINISTRATOR", "Logistics Operator", "Administrator"].includes(userRole);

  const shipment = useMemo(
    () =>
      shipments.find(
        (item) => item.trackingNumber.toLowerCase() === submittedTracking.trim().toLowerCase(),
      ),
    [shipments, submittedTracking],
  );

  const geocodingInFlight = useRef(new Set());

  // Geocoding hook
  useEffect(() => {
    if (!shipment) return;

    const citiesToGeocode = new Set();
    if (shipment.senderCity) citiesToGeocode.add(shipment.senderCity);
    if (shipment.receiverCity) citiesToGeocode.add(shipment.receiverCity);
    if (shipment.history) {
      shipment.history.forEach(event => {
        if (event.location && event.location !== "Unknown") {
          citiesToGeocode.add(event.location);
        }
      });
    }

    citiesToGeocode.forEach(city => {
      const normalizedCity = city.toLowerCase().trim();
      
      // Skip if already in static locationCoords or geocodedCoords or currently in-flight
      if (locationCoords[normalizedCity] || geocodedCoords[normalizedCity] || geocodingInFlight.current.has(normalizedCity)) {
        return;
      }

      geocodingInFlight.current.add(normalizedCity);

      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: city + ", India" }, (results, status) => {
          if (status === "OK" && results[0]?.geometry?.location) {
            const loc = results[0].geometry.location;
            setGeocodedCoords(prev => ({
              ...prev,
              [normalizedCity]: { lat: loc.lat(), lng: loc.lng() }
            }));
          } else {
            geocodingInFlight.current.delete(normalizedCity);
          }
        });
      } else {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ", India")}`)
          .then(res => res.json())
          .then(data => {
            if (data && data[0]) {
              const lat = parseFloat(data[0].lat);
              const lon = parseFloat(data[0].lon);
              setGeocodedCoords(prev => ({
                ...prev,
                [normalizedCity]: { lat, lng: lon }
              }));
            } else {
              geocodingInFlight.current.delete(normalizedCity);
            }
          })
          .catch(err => {
            console.error("OSM Geocoding failed:", err);
            geocodingInFlight.current.delete(normalizedCity);
          });
      }
    });
  }, [shipment, geocodedCoords]);

  const distanceToDestination = useMemo(() => {
    if (!shipment) return null;
    const destCoords = getCoords(shipment.receiverCity);
    
    const latestWithCoords = [...shipment.history]
      .reverse()
      .find(h => h.latitude !== null && h.longitude !== null);
      
    if (latestWithCoords) {
      return calculateHaversineDistance(
        Number(latestWithCoords.latitude), 
        Number(latestWithCoords.longitude), 
        destCoords.lat, 
        destCoords.lng
      );
    }
    
    const latestEvent = shipment.history?.at(-1);
    if (latestEvent?.location) {
      const currentCoords = getCoords(latestEvent.location);
      return calculateHaversineDistance(
        currentCoords.lat,
        currentCoords.lng,
        destCoords.lat,
        destCoords.lng
      );
    }
    
    return null;
  }, [shipment, getCoords]);

  const isNearDestination = useMemo(() => {
    if (distanceToDestination === null || !shipment) return false;
    const isActive = ["Picked Up", "In Transit", "Out for Delivery"].includes(shipment.status);
    return isActive && distanceToDestination <= 50;
  }, [distanceToDestination, shipment?.status]);

  const googleMapsDirUrl = useMemo(() => {
    if (!shipment) return "";
    let origin = shipment.senderCity;
    const latestWithCoords = [...shipment.history]
      .reverse()
      .find(h => h.latitude !== null && h.longitude !== null);
      
    if (latestWithCoords) {
      origin = `${latestWithCoords.latitude},${latestWithCoords.longitude}`;
    } else {
      const latestEvent = shipment.history?.at(-1);
      if (latestEvent?.location) {
        const coords = getCoords(latestEvent.location);
        origin = `${coords.lat},${coords.lng}`;
      } else {
        const startCoords = getCoords(shipment.senderCity);
        origin = `${startCoords.lat},${startCoords.lng}`;
      }
    }
    const destCoords = getCoords(shipment.receiverCity);
    const destination = `${destCoords.lat},${destCoords.lng}`;
    return `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
  }, [shipment, getCoords]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmittedTracking(trackingNumber);
  };

  // Regular timestamp refresh
  useEffect(() => {
    const refreshTimer = window.setInterval(() => setLastCheckedAt(new Date()), 30_000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  // Polling for the active shipment status/checkpoints in real-time
  useEffect(() => {
    if (!shipment) return;

    const isActive = ["Picked Up", "In Transit", "Out for Delivery"].includes(shipment.status);
    if (!isActive) return;

    console.log(`Live polling active for tracking number: ${shipment.trackingNumber}`);
    const pollTimer = window.setInterval(() => {
      fetchShipments();
      setLastCheckedAt(new Date());
    }, 8000); // Poll every 8 seconds

    return () => window.clearInterval(pollTimer);
  }, [shipment?.trackingNumber, shipment?.status, fetchShipments]);

  useEffect(() => {
    getMapConfig()
      .then((response) => setMapConfig(response.data))
      .catch(() => setMapConfig(null));
  }, []);

  useEffect(() => {
    if (!shipment) {
      setServerForecast(null);
      return undefined;
    }

    let ignoreResponse = false;
    getDeliveryForecast(shipment.trackingNumber)
      .then((response) => {
        if (!ignoreResponse) setServerForecast(response.data);
      })
      .catch(() => {
        if (!ignoreResponse) setServerForecast(null);
      });

    return () => {
      ignoreResponse = true;
    };
  }, [shipment]);

  useEffect(() => {
    if (!mapConfig?.apiKey) {
      setMapReady(false);
      return;
    }

    loadGoogleMaps()
      .then(() => setMapReady(true))
      .catch((err) => {
        console.error("Google Maps failed to load in TrackShipment:", err);
        setMapReady(false);
      });
  }, [mapConfig]);

  const simulateNextStep = async () => {
    if (!shipment) return;
    setSimErrorMsg("");

    const currentStatus = shipment.status;
    const startCity = shipment.senderCity;
    const endCity = shipment.receiverCity;

    const startCoords = getCoords(startCity);
    const endCoords = getCoords(endCity);

    // Calculate 10 intermediate points (1 to 10)
    const totalSteps = 10;
    const steps = [];
    for (let i = 1; i <= totalSteps; i++) {
      const ratio = i / totalSteps;
      const lat = startCoords.lat + ratio * (endCoords.lat - startCoords.lat);
      const lng = startCoords.lng + ratio * (endCoords.lng - startCoords.lng);
      
      let stepStatus = "In Transit";
      let locationName = `Transit Checkpoint ${i}`;
      let description = `En route between ${startCity} and ${endCity}`;
      
      if (i === 1) {
        stepStatus = "Picked Up";
        locationName = `${startCity} Hub`;
        description = `Shipment picked up at origin: ${startCity}`;
      } else if (i === totalSteps) {
        stepStatus = "Out for Delivery";
        locationName = `${endCity} Hub`;
        description = `Arrived at destination hub: ${endCity}, dispatching for delivery`;
      }
      
      steps.push({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        locationName,
        description,
        status: stepStatus
      });
    }

    // Count how many simulated coordinate steps are already recorded in history
    const simulatedEvents = shipment.history.filter(h => h.latitude !== null && h.longitude !== null);
    const currentStepIndex = simulatedEvents.length;

    try {
      if (currentStatus === "Created" || currentStatus === "Pending Approval") {
        setSimProgressMsg("Transitioning status to Picked Up...");
        await updateTrackingStatus({
          trackingNumber: shipment.trackingNumber,
          status: "PICKED_UP",
          description: `Shipment picked up at origin: ${startCity}`
        });

        setSimProgressMsg("Adding origin checkpoint coordinate...");
        await updateTrackingLocation({
          trackingNumber: shipment.trackingNumber,
          locationName: `${startCity} Hub`,
          description: `Pickup point setup`,
          latitude: startCoords.lat,
          longitude: startCoords.lng
        });

        setSimProgressMsg("Shipment picked up successfully.");
      } 
      else if (currentStatus === "Picked Up" || currentStatus === "In Transit") {
        if (currentStepIndex < totalSteps) {
          const nextStep = steps[currentStepIndex];
          setSimProgressMsg(`Simulating movement: ${nextStep.locationName}...`);

          const backendStatus = nextStep.status === "In Transit" ? "IN_TRANSIT" : "OUT_FOR_DELIVERY";
          await updateTrackingStatus({
            trackingNumber: shipment.trackingNumber,
            status: backendStatus,
            description: nextStep.description
          });

          await updateTrackingLocation({
            trackingNumber: shipment.trackingNumber,
            locationName: nextStep.locationName,
            description: nextStep.description,
            latitude: nextStep.lat,
            longitude: nextStep.lng
          });

          setSimProgressMsg(`Simulation update sent: ${nextStep.locationName}`);
        } else {
          setSimProgressMsg("Transitioning status to Out for Delivery...");
          await updateTrackingStatus({
            trackingNumber: shipment.trackingNumber,
            status: "OUT_FOR_DELIVERY",
            description: `Out for delivery in destination city: ${endCity}`
          });
        }
      } 
      else if (currentStatus === "Out for Delivery") {
        setSimProgressMsg("Completing delivery...");
        await updateTrackingStatus({
          trackingNumber: shipment.trackingNumber,
          status: "DELIVERED",
          description: `Delivered safely to receiver ${shipment.receiverName}`
        });

        await updateTrackingLocation({
          trackingNumber: shipment.trackingNumber,
          locationName: `${endCity} Receiver Address`,
          description: `Final delivery completed`,
          latitude: endCoords.lat,
          longitude: endCoords.lng
        });

        setSimProgressMsg("Delivery marked as completed!");
      } 
      else {
        setSimProgressMsg("Shipment is already delivered or cancelled.");
      }

      await fetchShipments();
    } catch (err) {
      console.error("Simulation error:", err);
      setSimErrorMsg("Failed to post simulation checkpoint. Ensure you have proper role rights.");
    }
  };

  // Auto-simulation hook
  useEffect(() => {
    if (!isSimulating || !shipment) return;

    if (["Delivered", "Cancelled", "Rejected"].includes(shipment.status)) {
      setIsSimulating(false);
      setSimProgressMsg("Simulation completed.");
      return;
    }

    const intervalId = setInterval(() => {
      simulateNextStep();
    }, 4500);

    return () => clearInterval(intervalId);
  }, [isSimulating, shipment?.status, shipment?.history?.length]);

  const latestEvent = shipment?.history?.at(-1);
  const localForecast = shipment ? getForecast(shipment) : null;
  const forecast = serverForecast
    ? {
        eta: formatDateTime(serverForecast.predictedDeliveryAt),
        remaining: serverForecast.predictedDelayMinutes > 0
          ? `${serverForecast.predictedDelayMinutes} min delay forecast`
          : `${serverForecast.confidencePercentage}% forecast confidence`,
        risk: serverForecast.riskLevel.replaceAll("_", " "),
        message: serverForecast.reason,
      }
    : localForecast;
  
  const estimatedDelay = serverForecast 
    ? serverForecast.predictedDelayMinutes 
    : (shipment?.traffic?.delayMinutes ?? 0);

  const trafficSeverity = serverForecast
    ? (serverForecast.predictedDelayMinutes > 240 ? "Heavy" : serverForecast.predictedDelayMinutes > 0 ? "Moderate" : "Low")
    : (shipment?.traffic?.severity ?? "Low");

  const vehicle = shipment?.vehicle;

  function getRiskClass(risk) {
    if (!risk) return "on-track";
    const normalized = risk.toLowerCase().replaceAll(" ", "-");
    if (normalized === "high") return "high-risk";
    return normalized;
  }
  const currentRoute = shipment ? `${shipment.senderCity} → ${shipment.receiverCity}` : "";

  const renderSimulatorPanel = () => {
    if (!isOperatorOrAdmin || !shipment) return null;

    const currentStatus = shipment.status;
    const isCompleted = ["Delivered", "Cancelled", "Rejected"].includes(currentStatus);
    const simulatedEvents = shipment.history.filter(h => h.latitude !== null && h.longitude !== null);
    const currentStepIndex = simulatedEvents.length;
    const totalSteps = 10;
    
    return (
      <section className="panel simulator-panel" style={{ marginBottom: 18 }}>
        <div className="simulator-header">
          <div className={`pulse-indicator ${isSimulating ? "simulating" : "idle"}`} />
          <div>
            <div className="eyebrow" style={{ color: "var(--brand)" }}>Operator Tools</div>
            <h2 className="section-title" style={{ marginTop: 2 }}>GPS & Delivery Simulator</h2>
          </div>
        </div>
        <p className="subtle" style={{ margin: "8px 0 16px" }}>
          Simulate a real vehicle traveling from <strong>{shipment.senderCity}</strong> to <strong>{shipment.receiverCity}</strong>. Updates database coordinates and shipment status in real-time.
        </p>

        <div className="simulator-progress-bar">
          <div className="simulator-progress-fill" style={{ width: `${Math.min(100, (currentStepIndex / totalSteps) * 100)}%` }} />
          <span className="progress-label">Route Progress: {Math.min(100, Math.round((currentStepIndex / totalSteps) * 100))}% ({currentStepIndex}/{totalSteps} steps)</span>
        </div>

        <div className="simulator-actions" style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button 
            type="button"
            className={`button ${isSimulating ? "secondary" : "primary"}`} 
            onClick={() => setIsSimulating(!isSimulating)}
            disabled={isCompleted}
          >
            {isSimulating ? "Pause Simulation" : "Start Auto-Simulation"}
          </button>
          
          <button 
            type="button"
            className="button secondary" 
            onClick={simulateNextStep}
            disabled={isSimulating || isCompleted}
          >
            Simulate Next Step
          </button>
        </div>

        {simProgressMsg && (
          <div className="simulator-status-msg" style={{ marginTop: 12, fontSize: 13, color: "var(--brand)", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="spinner-dot">●</span> {simProgressMsg}
          </div>
        )}

        {simErrorMsg && (
          <div className="alert danger" style={{ marginTop: 12, padding: "8px 12px", fontSize: 13 }}>
            {simErrorMsg}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Shipment tracking</div>
          <h1>Tracking dashboard</h1>
          <p className="subtle">
            Search a tracking number to view status, route, package details, and timeline history.
          </p>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: 18 }}>
        <form className="toolbar" onSubmit={handleSubmit}>
          <div className="form-field" style={{ flex: "1 1 340px" }}>
            <label htmlFor="trackingNumber">Tracking number</label>
            <input
              className="input"
              id="trackingNumber"
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="STP10024591"
              required
              value={trackingNumber}
            />
          </div>
          <button className="button primary" type="submit">
            Track shipment
          </button>
        </form>
      </section>

      {!shipment && (
        <div className="empty-state">
          No shipment found for {submittedTracking || "the entered tracking number"}.
        </div>
      )}

      {shipment && (
        <>
          {isNearDestination && (
            <div className="near-destination-alert" style={{ marginBottom: 18 }}>
              <span className="near-dest-bell">🔔</span>
              <div>
                <strong>Near Destination Proximity Alert</strong>
                <p>The shipment is currently <strong>{distanceToDestination.toFixed(1)} km</strong> away from the destination ({shipment.receiverCity}). Prepare for delivery!</p>
              </div>
            </div>
          )}

          <section className="live-monitoring" aria-label="Live delivery monitoring">
            <div>
              <div className="eyebrow">Live delivery monitoring</div>
              <strong>{latestEvent?.location || shipment.receiverCity}</strong>
              <span>Latest checkpoint: {latestEvent?.status || shipment.status}</span>
            </div>
            <div>
              <button 
                type="button"
                className={`live-risk ${getRiskClass(forecast.risk)} live-watch-button`}
                onClick={() => setShowLiveTracking(true)}
              >
                {forecast.risk}
              </button>
              <small>Checked {formatDateTime(lastCheckedAt)}</small>
            </div>
          </section>

          {renderSimulatorPanel()}
 
          <section className="tracking-map-panel panel" aria-label="Live delivery map">
            <div className="toolbar">
              <div>
                <div className="eyebrow">Location services</div>
                <h2 className="section-title" style={{ marginTop: 6 }}>Live route map</h2>
              </div>
              <a className="button secondary compact" href={googleMapsDirUrl} rel="noreferrer" target="_blank">Open in Google Maps</a>
            </div>
            <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 350, marginBottom: 14 }}>
              <LiveTrackingMap shipment={shipment} mapId="panel" onRouteCalculated={handleRouteCalculated} getCoords={getCoords} />
            </div>
            <p className="subtle" style={{ marginBottom: 0 }}>Current checkpoint: {latestEvent?.location || "Location update pending"}. Route: {currentRoute}.</p>
          </section>

          <section className="grid grid-2" style={{ marginBottom: 18 }}>
            <article className="panel forecast-panel">
              <div className="eyebrow">Vehicle status</div>
              <h2 className="section-title" style={{ marginTop: 6 }}>{vehicle?.name || "Vehicle assigned"}</h2>
              <div className="forecast-details"><span>Driver</span><strong>{vehicle?.driver || "Awaiting assignment"}</strong></div>
              <div className="forecast-details"><span>Speed</span><strong>{vehicle?.speedKmph || 0} km/h</strong></div>
              <p className="subtle">Current vehicle heading and live movement are reflected in the map marker.</p>
            </article>
            <article className="panel forecast-panel">
              <div className="eyebrow">Traffic & ETA</div>
              <h2 className="section-title" style={{ marginTop: 6 }}>{trafficSeverity} traffic</h2>
              <div className="forecast-details"><span>Total Distance</span><strong>{routeDetails.distance || "Calculating..."}</strong></div>
              <div className="forecast-details"><span>Est. Travel Time</span><strong>{routeDetails.duration || "Calculating..."}</strong></div>
              <div className="forecast-details"><span>Delay estimate</span><strong>{estimatedDelay} min</strong></div>
              <div className="forecast-details"><span>ETA window</span><strong>{forecast?.eta || shipment.eta}</strong></div>
              <p className="subtle">The ETA adjusts using traffic severity and recent movement updates for this route.</p>
            </article>
          </section>

          <section className="grid grid-2" style={{ marginBottom: 18 }}>
            <article className="panel forecast-panel">
              <div className="eyebrow">ETA prediction</div>
              <h2 className="section-title" style={{ marginTop: 6 }}>{forecast.eta}</h2>
              <div className="forecast-details"><span>Forecast window</span><strong>{forecast.remaining}</strong></div>
              <p className="subtle">{forecast.message}</p>
            </article>
            <article className="panel forecast-panel">
              <div className="eyebrow">Delivery forecast</div>
              <h2 className="section-title" style={{ marginTop: 6 }}>{forecast.risk}</h2>
              <div className="forecast-details"><span>Progress</span><strong>{shipment.progress}% complete</strong></div>
              <p className="subtle">Forecasts update from the current delivery status and latest location checkpoint.</p>
            </article>
          </section>

          <section className="grid grid-2">
          <div className="panel">
            <div className="toolbar">
              <div>
                <div className="eyebrow">Tracking number</div>
                <h2 className="section-title" style={{ marginTop: 6 }}>
                  {shipment.trackingNumber}
                </h2>
              </div>
              <span className={`badge ${statusClass(shipment.status)}`}>{shipment.status}</span>
            </div>

            <div className="route-strip">
              <div className="route-city">
                <strong>{shipment.senderCity}</strong>
                <div className="subtle">{shipment.senderName}</div>
              </div>
              <div className="route-arrow">to</div>
              <div className="route-city">
                <strong>{shipment.receiverCity}</strong>
                <div className="subtle">{shipment.receiverName}</div>
              </div>
            </div>

            <div className="grid grid-2" style={{ marginTop: 18 }}>
              <div className="schema-box">
                <strong>Route summary</strong>
                <p className="subtle" style={{ margin: "6px 0 0" }}>{currentRoute}</p>
              </div>
              <div className="schema-box">
                <strong>Traffic status</strong>
                <p className="subtle" style={{ margin: "6px 0 0" }}>{trafficSeverity} · {estimatedDelay} min delay</p>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div className="toolbar" style={{ marginBottom: 8 }}>
                <strong>Delivery progress</strong>
                <span className="subtle">{shipment.progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${shipment.progress}%` }} />
              </div>
            </div>

            <div className="grid grid-2" style={{ marginTop: 18 }}>
              <div className="schema-box">
                <strong>ETA</strong>
                <p className="subtle" style={{ margin: "6px 0 0" }}>
                  {shipment.eta}
                </p>
              </div>
              <div className="schema-box">
                <strong>Priority</strong>
                <p className="subtle" style={{ margin: "6px 0 0" }}>
                  {shipment.priority}
                </p>
              </div>
              <div className="schema-box">
                <strong>Package</strong>
                <p className="subtle" style={{ margin: "6px 0 0" }}>
                  {shipment.packageType}, {shipment.weight}
                </p>
              </div>
              <div className="schema-box">
                <strong>Address</strong>
                <p className="subtle" style={{ margin: "6px 0 0" }}>
                  {shipment.deliveryAddress}
                </p>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2 className="section-title">Tracking Timeline</h2>
            <ul className="timeline">
              {shipment.history.map((event) => (
                <li className="timeline-item" key={`${event.status}-${event.timestamp}`}>
                  <div className="timeline-dot" />
                  <div>
                    <div className="timeline-title">{event.status}</div>
                    <div className="timeline-meta">{event.location}</div>
                    <div className="timeline-meta">{formatDateTime(event.timestamp)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          </section>
          
          {showLiveTracking && (
            <div className="live-modal-overlay" onClick={() => setShowLiveTracking(false)}>
              <div className="live-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="live-modal-header">
                  <div>
                    <h2>Live Shipment Tracking</h2>
                    <p>Tracking Number: <strong>{shipment.trackingNumber}</strong> | Route: {shipment.senderCity} → {shipment.receiverCity}</p>
                  </div>
                  <button className="close-btn" onClick={() => setShowLiveTracking(false)} aria-label="Close modal">×</button>
                </div>
                <div className="live-modal-body">
                  <div className="live-modal-map-sec">
                    <div className="live-modal-card-title">Live Current Location Map</div>
                    <div style={{ flex: 1, minHeight: 350 }}>
                      <LiveTrackingMap shipment={shipment} onRouteCalculated={handleRouteCalculated} getCoords={getCoords} />
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="subtle" style={{ fontSize: 13, color: '#334155' }}>Current Location: <strong>{latestEvent?.location || shipment.receiverCity}</strong></span>
                      <a className="button secondary compact" href={googleMapsDirUrl} rel="noreferrer" target="_blank" style={{ margin: 0 }}>Open in Google Maps</a>
                    </div>
                  </div>
                  <div className="live-modal-info-sec">
                    <div>
                      <div className="live-modal-card-title">Delivery Status updates</div>
                      <StatusStepper currentStatus={shipment.status} />
                    </div>
                    
                    <div>
                      <div className="live-modal-card-title">Latest Checkpoint Details</div>
                      <div className="checkpoint-card">
                        <div className="checkpoint-card-header">
                          <div className="checkpoint-title">{latestEvent?.location || shipment.receiverCity}</div>
                          <div className="checkpoint-time">{formatDateTime(latestEvent?.timestamp || lastCheckedAt)}</div>
                        </div>
                        <div className="checkpoint-grid">
                          <div className="checkpoint-item">
                            <span>Status</span>
                            <strong>{latestEvent?.status || shipment.status}</strong>
                          </div>
                          <div className="checkpoint-item">
                            <span>Delivery Forecast</span>
                            <strong>{forecast.risk}</strong>
                          </div>
                          <div className="checkpoint-item">
                            <span>Vehicle / Driver</span>
                            <strong>{vehicle?.name || "Awaiting Driver"} ({vehicle?.driver || "N/A"})</strong>
                          </div>
                          <div className="checkpoint-item">
                            <span>Current Speed</span>
                            <strong>{vehicle?.speedKmph || 0} km/h</strong>
                          </div>
                          <div className="checkpoint-item">
                            <span>ETA Estimate</span>
                            <strong>{forecast.eta || shipment.eta}</strong>
                          </div>
                          <div className="checkpoint-item">
                            <span>Delay Status</span>
                            <strong>{estimatedDelay > 0 ? `${estimatedDelay} min` : "No Delay"}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="live-modal-card-title">Checkpoint Timeline</div>
                      <ul className="timeline" style={{ marginTop: 8 }}>
                        {shipment.history.map((event, idx) => (
                          <li className="timeline-item" key={`${event.status}-${event.timestamp}-${idx}`}>
                            <div className="timeline-dot" style={{ borderColor: idx === shipment.history.length - 1 ? 'var(--brand)' : '#94a3b8' }} />
                            <div>
                              <div className="timeline-title" style={{ fontWeight: idx === shipment.history.length - 1 ? 800 : 600 }}>{event.status}</div>
                              <div className="timeline-meta">{event.location}</div>
                              <div className="timeline-meta">{formatDateTime(event.timestamp)}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TrackShipment;
