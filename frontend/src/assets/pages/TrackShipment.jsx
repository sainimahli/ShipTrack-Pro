import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { ShipmentContext } from "../context/shipments";
import { calculateRoute, getDeliveryForecast, getETA, getRouteHistory, getTrackingLocation, updateTrackingLocation, updateTrackingStatus } from "../services/api";

const sourceIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const destIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='25' height='41' viewBox='0 0 25 41'><path d='M12.5 0C5.6 0 0 5.6 0 12.5 0 22 12.5 41 12.5 41S25 22 25 12.5C25 5.6 19.4 0 12.5 0z' fill='#c2410c'/><circle cx='12.5' cy='12.5' r='5' fill='#fff'/></svg>`
    ),
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const currentIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='45' viewBox='0 0 30 45'><path d='M15 0C6.7 0 0 6.7 0 15c0 11.3 15 30 15 30s15-18.7 15-30C30 6.7 23.3 0 15 0z' fill='#2563eb'/><circle cx='15' cy='15' r='6' fill='#fff'/></svg>`
    ),
  iconSize: [30, 45], iconAnchor: [15, 45], popupAnchor: [1, -34],
});

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
  }, [bounds, map]);
  return null;
}

const DEFAULT_CENTER = [12.9716, 77.5946];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

const shipmentSteps = [
  "Created",
  "Picked Up",
  "In Transit",
  "Out for Delivery",
  "Delivered",
];
const demoTrackingNumbers = [
  "STP10024591",
  "STP10024592",
  "STP10024593",
  "STP10024594",
  "STP10024595",
];

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

function DraggableRouteMap({ shipment, totalDistance, initialProgress, mapOrigin, mapDestination, onPositionChange }) {
  const [progress, setProgress] = useState(initialProgress);
  const origin = mapOrigin || DEFAULT_CENTER;
  const destination = mapDestination || DEFAULT_CENTER;

  useEffect(() => {
    setProgress(initialProgress);
  }, [initialProgress, shipment.trackingNumber]);

  const updateFromPointer = (event, save = false) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const nextProgress = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    setProgress(nextProgress);

    if (save && origin && destination) {
      const latitude = origin[0] + ((destination[0] - origin[0]) * nextProgress);
      const longitude = origin[1] + ((destination[1] - origin[1]) * nextProgress);
      const remainingKm = Math.round(haversineKm(latitude, longitude, destination[0], destination[1]) * 10) / 10;
      onPositionChange({ latitude, longitude, remainingKm, progress: nextProgress });
    }
  };

  if (!origin || !destination) {
    return <div className="interactive-route-map unavailable">Map is unavailable for this route.</div>;
  }

  return (
    <div
      aria-label="Drag the shipment icon along the route to update its location"
      className="interactive-route-map"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event);
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          updateFromPointer(event, true);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      role="slider"
      tabIndex="0"
    >
      <div className="route-map-city origin"><strong>{shipment.senderCity}</strong><span>Origin</span></div>
      <div className="route-map-city destination"><strong>{shipment.receiverCity}</strong><span>Destination</span></div>
      <div className="interactive-route-line"><span style={{ width: `${progress * 100}%` }} /></div>
      <button aria-label="Shipment position" className="shipment-map-marker" style={{ left: `${progress * 100}%` }} type="button">🚚</button>
      <div className="route-map-hint">Drag the shipment icon to choose its current position · Total: {totalDistance}</div>
    </div>
  );
}

function TrackShipment() {
  const { shipments, refetch } = useContext(ShipmentContext);
  const [trackingNumber, setTrackingNumber] = useState(shipments[0]?.trackingNumber || "");
  const [submittedTracking, setSubmittedTracking] = useState(shipments[0]?.trackingNumber || "");
  const [lastCheckedAt, setLastCheckedAt] = useState(() => new Date());
  const [serverForecast, setServerForecast] = useState(null);
  const [eta, setETA] = useState(null);
  console.log("ETA State:", eta);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [liveTracking, setLiveTracking] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const liveProgressRef = useRef(0);
  const deliveredRef = useRef(null);

  const [routeHistory, setRouteHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const shipment = useMemo(
    () =>
      shipments.find(
        (item) => item.trackingNumber.toLowerCase() === submittedTracking.trim().toLowerCase(),
      ),
    [shipments, submittedTracking],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmittedTracking(trackingNumber);
  };

  const handleSimulateCheckpoint = async () => {
    if (!shipment || shipment.progress >= 100 || shipment.status === "Delivered") return;
    setSimulating(true);
    try {
      const mapOrigin = routeData?.originCoords || DEFAULT_CENTER;
      const mapDestination = routeData?.destinationCoords || DEFAULT_CENTER;
      const currentCount = routeHistory.length;
      const nextProgress = Math.min(1, (currentCount + 1) * 0.15);
      const latitude = mapOrigin[0] + ((mapDestination[0] - mapOrigin[0]) * nextProgress);
      const longitude = mapOrigin[1] + ((mapDestination[1] - mapOrigin[1]) * nextProgress);
      const remainingKm = Math.round(haversineKm(latitude, longitude, mapDestination[0], mapDestination[1]) * 10) / 10;
      
      await updateTrackingLocation({
        trackingNumber: shipment.trackingNumber,
        latitude,
        longitude,
        locationName: nextProgress >= 1 ? shipment.receiverCity : `Checkpoint #${currentCount + 1} (${Math.round(nextProgress * 100)}% route)`,
        description: nextProgress >= 1 ? "Shipment reached destination." : `Simulated location check-in. ${remainingKm} km remaining.`,
        distanceRemainingKm: remainingKm,
      });
      if (nextProgress >= 1) {
        await updateTrackingStatus({
          trackingNumber: shipment.trackingNumber,
          status: "DELIVERED",
          description: "Shipment reached destination.",
          locationName: shipment.receiverCity,
        });
      }
      await refetch();
      refreshLiveTracking();
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulating(false);
    }
  };


  const refreshLiveTracking = useCallback(() => {
    setLastCheckedAt(new Date());
    setRefreshVersion((version) => version + 1);
  }, []);

  const updateMarkerPosition = useCallback(async ({ latitude, longitude, remainingKm, progress }) => {
    if (!shipment) return;
    const estimatedMinutes = Math.round(remainingKm);
    setRouteData((current) => current ? {
      ...current,
      remaining: {
        ...current.remaining,
        distanceKm: remainingKm,
        estimatedMinutes,
        estimatedTravelTime: formatDuration(estimatedMinutes),
      },
    } : current);
    liveProgressRef.current = progress;

    try {
      await updateTrackingLocation({
        trackingNumber: shipment.trackingNumber,
        latitude,
        longitude,
        locationName: `Route checkpoint (${Math.round(progress * 100)}% complete)`,
        description: `Marker moved; ${remainingKm} km remaining.`,
        distanceRemainingKm: remainingKm,
      });
      await refetch();
      refreshLiveTracking();
    } catch (error) {
      console.error("Could not save shipment marker position:", error);
    }
  }, [refetch, refreshLiveTracking, shipment]);

  useEffect(() => {
    const refreshTimer = window.setInterval(refreshLiveTracking, 10 * 60 * 1000);
    return () => window.clearInterval(refreshTimer);
  }, [refreshLiveTracking]);

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
   getETA(shipment.trackingNumber)
  .then((response) => {
    console.log("ETA Response:", JSON.stringify(response.data, null, 2));

    if (!ignoreResponse) {
      setETA(response.data);
    }
  })
  .catch((error) => {
    console.log("ETA Error:", error.response?.data || error);

    if (!ignoreResponse) {
      setETA(null);
    }
  });
    return () => {
      ignoreResponse = true;
    };


  }, [shipment?.trackingNumber, refreshVersion]);

  useEffect(() => {
    if (!shipment) {
      setRouteHistory([]);
      return undefined;
    }

    let ignoreResponse = false;

    const fetchHistory = () => {
      setHistoryLoading(true);
      setHistoryError(null);
      getRouteHistory(shipment.trackingNumber)
        .then((response) => {
          if (!ignoreResponse) {
            setRouteHistory(response.data?.events || []);
            setHistoryLoading(false);
          }
        })
        .catch((err) => {
          if (!ignoreResponse) {
            setHistoryError(err.response?.data?.message || "Failed to load route history.");
            setHistoryLoading(false);
          }
        });
    };

    fetchHistory();
    const historyTimer = window.setInterval(fetchHistory, 10 * 60 * 1000);

    return () => {
      ignoreResponse = true;
      window.clearInterval(historyTimer);
    };
  }, [shipment?.trackingNumber, refreshVersion]);

  useEffect(() => {
    if (!shipment?.senderCity || !shipment?.receiverCity) {
      setRouteData(null);
      return undefined;
    }

    let ignoreResponse = false;

    async function geocodeCity(query) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query + ", India")}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (res.ok) {
          const data = await res.json();
          if (data.length) {
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          }
        }
      } catch (e) { /* fallback */ }
      return null;
    }

    async function loadAccurateRoute() {
      const origGeo = await geocodeCity(shipment.senderCity);
      const destGeo = await geocodeCity(shipment.receiverCity);

      const origLat = origGeo ? origGeo[0] : (shipment.originLatitude ?? 12.9716);
      const origLng = origGeo ? origGeo[1] : (shipment.originLongitude ?? 77.5946);
      const destLat = destGeo ? destGeo[0] : (shipment.destinationLatitude ?? 26.8467);
      const destLng = destGeo ? destGeo[1] : (shipment.destinationLongitude ?? 80.9462);

      const originCoords = [origLat, origLng];
      const destinationCoords = [destLat, destLng];

      let polylineCoords = [originCoords, destinationCoords];
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origLng},${origLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=false`;
        const res = await fetch(osrmUrl);
        if (res.ok) {
          const osrmData = await res.json();
          if (osrmData.routes?.length) {
            polylineCoords = osrmData.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
          }
        }
      } catch (e) { /* fallback straight line */ }

      if (!ignoreResponse) {
        setRouteData({
          total: { distanceKm: Math.round(haversineKm(origLat, origLng, destLat, destLng)) },
          remaining: { distanceKm: Math.round(haversineKm(origLat, origLng, destLat, destLng)), estimatedTravelTime: formatDuration(Math.round(haversineKm(origLat, origLng, destLat, destLng))) },
          originCoords,
          destinationCoords,
          polylineCoords,
        });
      }
    }

    loadAccurateRoute();

    return () => {
      ignoreResponse = true;
    };
  }, [shipment?.senderCity, shipment?.receiverCity, shipment?.trackingNumber]);

  const mapOrigin = useMemo(() => routeData?.originCoords || DEFAULT_CENTER, [routeData]);
  const mapDestination = useMemo(() => routeData?.destinationCoords || DEFAULT_CENTER, [routeData]);

  const mapBounds = useMemo(() => {
    if (!mapOrigin || !mapDestination) return null;
    return [mapOrigin, mapDestination];
  }, [mapOrigin, mapDestination]);

  const currentLat = currentLocation
    ? currentLocation.latitude
    : (shipment?.currentLatitude != null
      ? shipment.currentLatitude
      : null);
  const currentLng = currentLocation
    ? currentLocation.longitude
    : (shipment?.currentLongitude != null
      ? shipment.currentLongitude
      : null);

  const markerProgress = useMemo(() => {
    if (!mapOrigin || !mapDestination) return 0;
    if (currentLat != null && currentLng != null) {
      const totalDist = haversineKm(mapOrigin[0], mapOrigin[1], mapDestination[0], mapDestination[1]);
      if (totalDist > 0) {
        const remaining = haversineKm(currentLat, currentLng, mapDestination[0], mapDestination[1]);
        return Math.max(0, Math.min(1, 1 - (remaining / totalDist)));
      }
    }
    if (routeData && routeData.total?.distanceKm > 0) {
      return Math.max(0, Math.min(1, 1 - (routeData.remaining.distanceKm / routeData.total.distanceKm)));
    }
    return 0;
  }, [mapOrigin, mapDestination, currentLat, currentLng, routeData]);

  useEffect(() => {
    liveProgressRef.current = markerProgress;
  }, [markerProgress]);

  useEffect(() => {
    if (!shipment || !routeData || !mapOrigin || !mapDestination || shipment.status === "Delivered" || shipment.progress >= 100 || liveProgressRef.current >= 1) {
      return undefined;
    }

    const timer = window.setInterval(async () => {
      const nextProgress = Math.min(1, liveProgressRef.current + 0.02);
      const latitude = mapOrigin[0] + ((mapDestination[0] - mapOrigin[0]) * nextProgress);
      const longitude = mapOrigin[1] + ((mapDestination[1] - mapOrigin[1]) * nextProgress);
      const remainingKm = Math.round(haversineKm(latitude, longitude, mapDestination[0], mapDestination[1]) * 10) / 10;
      liveProgressRef.current = nextProgress;
      setRouteData((current) => current ? {
        ...current,
        remaining: {
          ...current.remaining,
          distanceKm: remainingKm,
          estimatedMinutes: Math.round(remainingKm),
          estimatedTravelTime: formatDuration(Math.round(remainingKm)),
        },
      } : current);

      try {
        await updateTrackingLocation({
          trackingNumber: shipment.trackingNumber,
          latitude,
          longitude,
          locationName: nextProgress >= 1 ? shipment.receiverCity : `Live route (${Math.round(nextProgress * 100)}%)`,
          description: `Live movement update; ${remainingKm} km remaining.`,
          distanceRemainingKm: remainingKm,
        });
        await refetch();
        if (nextProgress >= 1 && deliveredRef.current !== shipment.trackingNumber) {
          deliveredRef.current = shipment.trackingNumber;
          await updateTrackingStatus({
            trackingNumber: shipment.trackingNumber,
            status: "DELIVERED",
            description: "Shipment reached the destination.",
            locationName: shipment.receiverCity,
          });
          await refetch();
        }
      } catch (error) {
        console.error("Live movement update failed:", error);
      }
    }, 10 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [routeData, shipment, mapOrigin, mapDestination, refetch]);

  const latestEvent = shipment?.history?.at(-1);
  const serverStatus = liveTracking?.status?.currentStatus?.replaceAll("_", " ");
  const liveLocation = liveTracking?.location?.locationName;
  const displayStatus = serverStatus || shipment?.status;
  const rawTimeline = liveTracking?.timeline?.length
    ? liveTracking.timeline.map((event) => ({
        status: event.status?.replaceAll("_", " ") || "Update",
        location: event.locationName || event.description || "Location update pending",
        timestamp: event.updatedAt,
      }))
    : shipment?.history || [];

  const displayTimeline = useMemo(() => {
    const seenStatuses = new Set();
    return rawTimeline.filter((event) => {
      if (seenStatuses.has(event.status)) {
        return false;
      }
      seenStatuses.add(event.status);
      return true;
    });
  }, [rawTimeline]);
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
  const totalDistanceKm = routeData ? `${routeData.total.distanceKm} km` : "Calculating...";
  const backendRemainingKm = shipment?.distanceRemainingKm;

  const mapQuery = (currentLat != null && currentLng != null)
    ? `${currentLat},${currentLng}`
    : (shipment
      ? encodeURIComponent(latestEvent?.location || `${shipment.receiverCity}, India`)
      : "");
  const remainingDistanceKm = shipment?.status === "Delivered"
    ? "0 km"
    : (currentLocation && backendRemainingKm != null
      ? `${Math.round(backendRemainingKm)} km`
      : routeData
        ? `${routeData.remaining.distanceKm} km`
        : "Calculating...");
  const estimatedTravelTime = routeData ? routeData.remaining.estimatedTravelTime : "Calculating...";

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
          <section className="live-monitoring" aria-label="Live delivery monitoring">
            <div>
              <div className="eyebrow">Live delivery monitoring</div>
              <strong>{liveLocation || latestEvent?.location || shipment.receiverCity}</strong>
              <span>Latest checkpoint: {displayStatus}</span>
            </div>
            <div>
              <span className={`live-risk ${forecast.risk.toLowerCase().replaceAll(" ", "-")}`}>{forecast.risk}</span>


              <small>Checked {formatDateTime(lastCheckedAt)}</small>
            </div>
          </section>

          <section className="tracking-map-panel panel" aria-label="Live delivery map">
            <div className="toolbar">
              <div>
                <div className="eyebrow">Location services</div>
                <h2 className="section-title" style={{ marginTop: 6 }}>Live route map</h2>

                <p className="subtle" style={{ margin: "4px 0 0" }}>
                  Auto-refreshes every 20 minutes · Last synced {formatDateTime(lastCheckedAt)}
                </p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  className="button primary compact"
                  disabled={simulating || shipment.progress >= 100 || shipment.status === "Delivered"}
                  onClick={handleSimulateCheckpoint}
                  type="button"
                >
                  {simulating
                    ? "Simulating..."
                    : shipment.progress >= 100 || shipment.status === "Delivered"
                      ? "✓ Route Completed"
                      : "📍 Simulate Route Checkpoint"}
                </button>
                <button className="button secondary compact" onClick={refreshLiveTracking} type="button">
                  Refresh now
                </button>
                <a className="button secondary compact" href={`https://www.google.com/maps/dir/${encodeURIComponent(shipment.senderCity)}/${encodeURIComponent(shipment.receiverCity)}`} rel="noreferrer" target="_blank">Open in Google Maps</a>
              </div>
            </div>
            <div className="map-with-marker" style={{ height: 420, overflow: "hidden", position: "relative" }}>
              <MapContainer
                center={mapOrigin}
                zoom={6}
                scrollWheelZoom
                style={{ height: "100%", width: "100%", borderRadius: "8px 8px 0 0" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={mapOrigin} icon={sourceIcon}>
                  <Popup>
                    <strong>Origin: {shipment.senderCity}</strong>
                    <div style={{ fontSize: 12 }}>{shipment.senderName}</div>
                  </Popup>
                </Marker>
                <Marker position={mapDestination} icon={destIcon}>
                  <Popup>
                    <strong>Destination: {shipment.receiverCity}</strong>
                    <div style={{ fontSize: 12 }}>{shipment.receiverName}</div>
                  </Popup>
                </Marker>
                {currentLat != null && currentLng != null && (
                  <Marker position={[currentLat, currentLng]} icon={currentIcon}>
                    <Popup>
                      <strong>Current Checkpoint: {displayStatus}</strong>
                      <div style={{ fontSize: 12 }}>{liveLocation || latestEvent?.location || "In Transit"}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>
                        {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
                      </div>
                    </Popup>
                  </Marker>
                )}
                <Polyline
                  positions={routeData?.polylineCoords || [mapOrigin, mapDestination]}
                  pathOptions={{ color: "#146c94", weight: 5, opacity: 0.85 }}
                />
                <FitBounds bounds={mapBounds} />
              </MapContainer>
              <DraggableRouteMap
                initialProgress={markerProgress}
                mapDestination={mapDestination}
                mapOrigin={mapOrigin}
                onPositionChange={updateMarkerPosition}
                shipment={shipment}
                totalDistance={totalDistanceKm}
              />
            </div>
            <p className="subtle" style={{ marginBottom: 0 }}>Current checkpoint: {latestEvent?.location || "Location update pending"}. Route: {shipment.senderCity} to {shipment.receiverCity}. Remaining distance: {remainingDistanceKm}. Est. travel time: {estimatedTravelTime}.</p>
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
           {eta && (
  <section style={{ marginBottom: 18 }}>
    <article className="panel">
      <div className="eyebrow">ETA Information</div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="schema-box">
          <strong>Estimated Arrival</strong>
          <p className="subtle">
            {eta.estimatedArrival}
          </p>
        </div>
           <div className="schema-box">
  <strong>Remaining Distance</strong>
  <p className="subtle">
    {remainingDistanceKm}
  </p>
</div>
        <div className="schema-box">
          <strong>Remaining Time</strong>
          <p className="subtle">
            {eta.remainingTime}
          </p>
        </div>

        <div className="schema-box">
          <strong>Shipment Status</strong>
          <p className="subtle">
            {eta.shipmentStatus}
          </p>
        </div>

        <div className="schema-box">
          <strong>Delay Reason</strong>
          <p className="subtle">
            {eta.delayReason ?? "No Delay"}
          </p>
        </div>
      </div>
    </article>
  </section>
)}
          <section className="grid grid-2">
            <div className="panel">
              <div className="toolbar">
                <div>
                  <div className="eyebrow">Tracking number</div>
                  <h2 className="section-title" style={{ marginTop: 6 }}>
                    {shipment.trackingNumber}
                  </h2>
                </div>
                <span className={`badge ${statusClass(displayStatus)}`}>{displayStatus}</span>
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
                  <p className="subtle" style={{ margin: "6px 0 0" }}>{shipment.eta}</p>
                </div>
                <div className="schema-box">
                  <strong>Priority</strong>
                  <p className="subtle" style={{ margin: "6px 0 0" }}>{shipment.priority}</p>
                </div>
                <div className="schema-box">
                  <strong>Package</strong>
                  <p className="subtle" style={{ margin: "6px 0 0" }}>
                    {shipment.packageType}, {shipment.weight}
                  </p>
                </div>
                <div className="schema-box">
                  <strong>Address</strong>
                  <p className="subtle" style={{ margin: "6px 0 0" }}>{shipment.deliveryAddress}</p>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="tracking-stats">
                <div className="stat-box">
                  🚚
                  <h2>{remainingDistanceKm}</h2>
                  <p>Distance Remaining</p>
                  <span>Total route: {totalDistanceKm}</span>
                </div>
                <div className="stat-box">
                  ⏱
                  <h2>{estimatedTravelTime}</h2>
                  <p>Est. Travel Time</p>
                  <span>On Schedule</span>
                </div>
                <div className="stat-box">
                  📦
                  <h2>{shipment.progress}%</h2>
                  <p>Shipment Progress</p>
                  <span>Live Updated</span>
                </div>
              </div>

              <h2 className="section-title">Tracking Timeline</h2>
              <ul className="timeline">
                {displayTimeline.map((event) => (
                  <li className="timeline-item" key={`${event.status}-${event.timestamp}`}>
                    <div className={`timeline-dot ${event.status === displayStatus ? "live" : ""}`}>
                      {event.status === "Delivered"
                        ? "✅"
                        : event.status === "Out for Delivery"
                          ? "🚚"
                          : event.status === "In Transit"
                            ? "🚛"
                            : event.status === "Picked Up"
                              ? "📦"
                              : "📝"}
                    </div>
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
        </>
      )}
    </div>
  );
}

export default TrackShipment;
