import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { ShipmentContext } from "../context/shipments";
import {
  calculateRoute,
  getDeliveryForecast,
  getDriverLocation,
  getETA,
  getShipmentAlerts,
  getTrackingLocation,
  getTrackingTimeline,
  markAlertAsRead,
  predictShipmentDelay,
  updateTrackingLocation,
  updateTrackingStatus,
} from "../services/api";

// ---------------------------------------------------------------------------
// Leaflet default icon fix (needed when bundled with Vite/webpack)
// ---------------------------------------------------------------------------
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const vehicleIcon = L.divIcon({
  html: '<div style="font-size:26px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">🚚</div>',
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const driverIcon = L.divIcon({
  html: '<div style="font-size:24px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4))">👤</div>',
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const originIcon = L.divIcon({
  html: '<div style="background:#2563eb;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>',
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destIcon = L.divIcon({
  html: '<div style="background:#dc2626;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>',
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// ---------------------------------------------------------------------------
// Map auto-fit helper (same pattern as RouteManagement.jsx)
// ---------------------------------------------------------------------------
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
}

// ---------------------------------------------------------------------------
// Geocode a city name using Nominatim (same API as RouteManagement.jsx)
// ---------------------------------------------------------------------------
async function geocodeCity(cityName) {
  const query = `${cityName}, India`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Geocoding failed for ${cityName}`);
  const data = await res.json();
  if (!data.length) throw new Error(`No geocoding results for ${cityName}`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

// ---------------------------------------------------------------------------
// Fetch road route geometry from OSRM (same API as RouteManagement.jsx)
// Returns array of [lat, lng] waypoints along the actual road
// ---------------------------------------------------------------------------
async function fetchOsrmRoute(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lon},${from.lat};${to.lon},${to.lat}` +
    `?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("OSRM routing failed");
  const data = await res.json();
  if (!data.routes?.length) throw new Error("OSRM: no route found");
  const route = data.routes[0];
  return {
    // OSRM returns [lon, lat], Leaflet needs [lat, lon]
    coords: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  };
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------
function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

function statusClass(status) {
  return String(status).toLowerCase().replaceAll(" ", "-");
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Haversine distance between two [lat,lng] points (km)
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Given a list of route waypoints and a fraction [0,1], return the interpolated [lat,lng]
function positionAlongRoute(coords, fraction) {
  if (!coords || coords.length === 0) return null;
  if (fraction <= 0) return coords[0];
  if (fraction >= 1) return coords[coords.length - 1];

  // compute total path length
  let totalLen = 0;
  const segLens = [];
  for (let i = 1; i < coords.length; i++) {
    const d = haversineKm(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
    segLens.push(d);
    totalLen += d;
  }

  let target = fraction * totalLen;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i]) {
      const t = segLens[i] > 0 ? target / segLens[i] : 0;
      const lat = coords[i][0] + t * (coords[i + 1][0] - coords[i][0]);
      const lng = coords[i][1] + t * (coords[i + 1][1] - coords[i][1]);
      return [lat, lng];
    }
    target -= segLens[i];
  }
  return coords[coords.length - 1];
}

// Convert a fraction to remaining km using total route distance
function remainingKmFromFraction(totalKm, fraction) {
  return Math.max(0, Math.round(totalKm * (1 - fraction) * 10) / 10);
}

// ---------------------------------------------------------------------------
// Forecast helpers (local fallback when server forecast unavailable)
// ---------------------------------------------------------------------------
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
  const forecast = forecastByStatus[shipment.status] || {
    remaining: "Under review",
    risk: "WATCH",
  };
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function TrackShipment() {
  const { shipments, refetch } = useContext(ShipmentContext);

  // Search state — pre-fill with first available shipment if present
  const [trackingNumber, setTrackingNumber] = useState(
    () => shipments[0]?.trackingNumber ?? "",
  );
  const [submittedTracking, setSubmittedTracking] = useState(
    () => shipments[0]?.trackingNumber ?? "",
  );

  const [lastCheckedAt, setLastCheckedAt] = useState(() => new Date());
  const [refreshVersion, setRefreshVersion] = useState(0);

  // Backend-fetched data
  const [serverForecast, setServerForecast] = useState(null);
  const [eta, setETA] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null); // { latitude, longitude, locationName, timestamp }
  const [delayPrediction, setDelayPrediction] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [timeline, setTimeline] = useState([]); // backend tracking timeline

  // Route + live position state
  const [routeGeometry, setRouteGeometry] = useState(null); // { coords:[[lat,lng],...], distanceKm, durationMin }
  const [routeGeometryLoading, setRouteGeometryLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null); // { latitude, longitude } from backend

  // Vehicle animation: fraction [0,1] along the OSRM route
  const vehicleFractionRef = useRef(0);
  const [vehiclePosition, setVehiclePosition] = useState(null); // [lat, lng]
  const deliveredRef = useRef(null);

  // Find the shipment matching the submitted tracking number
  const shipment = useMemo(
    () =>
      shipments.find(
        (item) =>
          item.trackingNumber.toLowerCase() ===
          submittedTracking.trim().toLowerCase(),
      ),
    [shipments, submittedTracking],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmittedTracking(trackingNumber);
  };

  // ── Periodic refresh trigger ──────────────────────────────────────────────
  const refreshLiveTracking = useCallback(() => {
    setLastCheckedAt(new Date());
    setRefreshVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const id = window.setInterval(refreshLiveTracking, 15_000);
    return () => window.clearInterval(id);
  }, [refreshLiveTracking]);

  // ── Fetch forecast + ETA (refresh-driven) ─────────────────────────────────
  useEffect(() => {
    if (!shipment) {
      setServerForecast(null);
      setETA(null);
      return undefined;
    }

    let cancelled = false;

    getDeliveryForecast(shipment.trackingNumber)
      .then((res) => { if (!cancelled) setServerForecast(res.data); })
      .catch(() => { if (!cancelled) setServerForecast(null); });

    getETA(shipment.trackingNumber)
      .then((res) => { if (!cancelled) setETA(res.data); })
      .catch(() => { if (!cancelled) setETA(null); });

    return () => { cancelled = true; };
  }, [shipment, refreshVersion]);

  // ── Fetch delay prediction + alerts + driver + driver location ────────────
  useEffect(() => {
    if (!shipment) {
      setDelayPrediction(null);
      setAlerts([]);
      setDriver(null);
      setDriverLocation(null);
      return undefined;
    }

    let cancelled = false;

    async function loadOperationalData() {
      try {
        const [delayRes, alertsRes] = await Promise.all([
          predictShipmentDelay(shipment.shipmentId),
          getShipmentAlerts(shipment.shipmentId),
        ]);
        if (!cancelled) {
          setDelayPrediction(delayRes.data);
          setAlerts(alertsRes.data || []);
        }
      } catch {
        // non-fatal — panels will simply stay empty
      }

      if (shipment.assignedDriverId) {
        if (!cancelled) {
          setDriver({
            name: `Driver #${shipment.assignedDriverId}`,
            driverId: shipment.assignedDriverId,
          });
        }
        try {
          const locRes = await getDriverLocation(shipment.assignedDriverId);
          if (!cancelled) setDriverLocation(locRes.data ?? null);
        } catch {
          if (!cancelled) setDriverLocation(null);
        }
      } else {
        if (!cancelled) {
          setDriver(null);
          setDriverLocation(null);
        }
      }
    }

    loadOperationalData();
    return () => { cancelled = true; };
  }, [shipment, refreshVersion]);

  // ── Fetch backend tracking timeline ──────────────────────────────────────
  useEffect(() => {
    if (!shipment) {
      setTimeline([]);
      return undefined;
    }

    let cancelled = false;

    getTrackingTimeline(shipment.trackingNumber)
      .then((res) => {
        if (!cancelled) {
          const events = Array.isArray(res.data) ? res.data : [];
          setTimeline(
            events.map((e) => ({
              status: (e.status ?? e.eventType ?? "Update").replaceAll("_", " "),
              location: e.locationName ?? e.description ?? "Location update pending",
              timestamp: e.updatedAt ?? e.createdAt ?? null,
            })),
          );
        }
      })
      .catch(() => { if (!cancelled) setTimeline([]); });

    return () => { cancelled = true; };
  }, [shipment, refreshVersion]);

  // ── Fetch latest backend tracking location ────────────────────────────────
  useEffect(() => {
    if (!shipment) {
      setCurrentLocation(null);
      return undefined;
    }

    let cancelled = false;

    getTrackingLocation(shipment.trackingNumber)
      .then((res) => {
        if (!cancelled) {
          const loc = res.data;
          if (loc?.latitude != null && loc?.longitude != null) {
            setCurrentLocation({ latitude: loc.latitude, longitude: loc.longitude });
          }
        }
      })
      .catch(() => { if (!cancelled) setCurrentLocation(null); });

    return () => { cancelled = true; };
  }, [shipment?.trackingNumber, refreshVersion]);

  // ── Fetch OSRM route geometry when shipment cities change ─────────────────
  // Same approach as RouteManagement.jsx: Nominatim geocoding → OSRM route
  useEffect(() => {
    if (!shipment?.senderCity || !shipment?.receiverCity) {
      setRouteGeometry(null);
      setVehiclePosition(null);
      vehicleFractionRef.current = 0;
      return undefined;
    }

    let cancelled = false;
    setRouteGeometryLoading(true);

    async function fetchGeometry() {
      try {
        const [fromCoords, toCoords] = await Promise.all([
          geocodeCity(shipment.senderCity),
          geocodeCity(shipment.receiverCity),
        ]);
        const routeData = await fetchOsrmRoute(fromCoords, toCoords);
        if (!cancelled) {
          setRouteGeometry(routeData);
          // Seed vehicle at the current backend location if available
          if (
            currentLocation?.latitude != null &&
            currentLocation?.longitude != null
          ) {
            // Find fraction by closest point on the route
            let bestFrac = 0;
            let bestDist = Infinity;
            const { coords, distanceKm } = routeData;
            let cumLen = 0;
            let totalLen = 0;
            const segLens = [];
            for (let i = 1; i < coords.length; i++) {
              const d = haversineKm(coords[i-1][0], coords[i-1][1], coords[i][0], coords[i][1]);
              segLens.push(d);
              totalLen += d;
            }
            cumLen = 0;
            for (let i = 1; i < coords.length; i++) {
              const d = haversineKm(
                currentLocation.latitude, currentLocation.longitude,
                coords[i][0], coords[i][1],
              );
              if (d < bestDist) {
                bestDist = d;
                bestFrac = totalLen > 0 ? (cumLen + segLens[i - 1]) / totalLen : 0;
              }
              cumLen += segLens[i - 1];
            }
            vehicleFractionRef.current = Math.min(bestFrac, 1);
          } else if (shipment.progress) {
            vehicleFractionRef.current = Math.min(Number(shipment.progress) / 100, 1);
          }
          const initialPos = positionAlongRoute(
            routeData.coords,
            vehicleFractionRef.current,
          );
          if (initialPos) setVehiclePosition(initialPos);
        }
      } catch {
        // Route geometry unavailable — vehicle panel will show a fallback message
        if (!cancelled) setRouteGeometry(null);
      } finally {
        if (!cancelled) setRouteGeometryLoading(false);
      }
    }

    fetchGeometry();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipment?.senderCity, shipment?.receiverCity, shipment?.trackingNumber]);

  // ── Live vehicle movement along OSRM road waypoints ──────────────────────
  // Every 5 seconds: advance vehicle fraction → compute new [lat,lng] from
  // actual road coords array → persist to backend → update map marker.
  // This is NOT straight-line interpolation — position comes from the OSRM
  // polyline, so the truck follows bends in the road.
  useEffect(() => {
    if (
      !shipment ||
      !routeGeometry ||
      shipment.status === "Delivered" ||
      shipment.status === "Cancelled"
    ) {
      return undefined;
    }

    const { coords, distanceKm, durationMin } = routeGeometry;
    // Speed: advance enough each tick to finish in ~durationMin total
    // ticks per full journey = durationMin * 60 / 5
    const ticksToFinish = Math.max(1, (durationMin * 60) / 5);
    const fractionPerTick = 1 / ticksToFinish;

    const timer = window.setInterval(async () => {
      const nextFraction = Math.min(1, vehicleFractionRef.current + fractionPerTick);
      vehicleFractionRef.current = nextFraction;

      // Position along actual OSRM road waypoints — NOT straight line
      const nextPos = positionAlongRoute(coords, nextFraction);
      if (nextPos) setVehiclePosition(nextPos);

      const remainingKm = remainingKmFromFraction(distanceKm, nextFraction);

      try {
        await updateTrackingLocation({
          trackingNumber: shipment.trackingNumber,
          latitude: nextPos?.[0] ?? null,
          longitude: nextPos?.[1] ?? null,
          locationName:
            nextFraction >= 1
              ? shipment.receiverCity
              : `Live route (${Math.round(nextFraction * 100)}% complete)`,
          description: `Live movement update; ${remainingKm} km remaining.`,
          distanceRemainingKm: remainingKm,
        });

        if (nextFraction >= 1 && deliveredRef.current !== shipment.trackingNumber) {
          deliveredRef.current = shipment.trackingNumber;
          await updateTrackingStatus({
            trackingNumber: shipment.trackingNumber,
            status: "DELIVERED",
            description: "Shipment reached the destination.",
            locationName: shipment.receiverCity,
          });
          await refetch();
        }
      } catch {
        // Network error during live update — not fatal, will retry next tick
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [shipment, routeGeometry, refetch]);

  // ── Mark alert as read ────────────────────────────────────────────────────
  const handleMarkAlertRead = useCallback(async (alertId) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)),
      );
    } catch {
      // silent — user can try again
    }
  }, []);

  // ── Derived display values ────────────────────────────────────────────────
  const displayStatus = shipment?.status ?? "";

  const displayTimeline =
    timeline.length > 0
      ? timeline
      : (shipment?.history ?? []);

  const localForecast = shipment ? getForecast(shipment) : null;

  const forecast = serverForecast
    ? {
        eta: formatDateTime(serverForecast.predictedDeliveryAt),
        remaining:
          serverForecast.predictedDelayMinutes > 0
            ? `${serverForecast.predictedDelayMinutes} min delay forecast`
            : `${serverForecast.confidencePercentage}% forecast confidence`,
        risk: serverForecast.riskLevel.replaceAll("_", " "),
        message: serverForecast.reason,
      }
    : localForecast;

  const totalDistanceStr = routeGeometry
    ? `${routeGeometry.distanceKm.toFixed(1)} km`
    : "Calculating…";

  const remainingKm = vehiclePosition && routeGeometry
    ? remainingKmFromFraction(
        routeGeometry.distanceKm,
        vehicleFractionRef.current,
      )
    : null;

  const remainingDistanceStr =
    shipment?.status === "Delivered"
      ? "0 km"
      : remainingKm != null
      ? `${remainingKm} km`
      : "Calculating…";

  const estimatedTravelTime =
    routeGeometry && remainingKm != null
      ? formatDuration(
          (remainingKm / routeGeometry.distanceKm) * routeGeometry.durationMin,
        )
      : "Calculating…";

  const latestEvent = displayTimeline[displayTimeline.length - 1];
  const liveLocation =
    latestEvent?.location ??
    (shipment ? `En route to ${shipment.receiverCity}` : "");

  // Map bounds for FitBounds
  const mapBounds = routeGeometry?.coords;

  // Driver location as [lat,lng] if available
  const driverLatLng =
    driverLocation?.latitude != null && driverLocation?.longitude != null
      ? [driverLocation.latitude, driverLocation.longitude]
      : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
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

      {/* ── Search form ── */}
      <section className="panel" style={{ marginBottom: 18 }}>
        <form className="toolbar" onSubmit={handleSubmit}>
          <div className="form-field" style={{ flex: "1 1 340px" }}>
            <label htmlFor="trackingNumber">Tracking number</label>
            <input
              className="input"
              id="trackingNumber"
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="e.g. SHIP-XXXXXXXX"
              required
              value={trackingNumber}
            />
          </div>
          <button className="button primary" type="submit">
            Track shipment
          </button>
        </form>
      </section>

      {/* ── Not found ── */}
      {!shipment && submittedTracking && (
        <div className="empty-state">
          No shipment found for{" "}
          <strong>{submittedTracking}</strong>.
        </div>
      )}

      {/* ── Main tracking UI ── */}
      {shipment && (
        <>
          {/* Live monitoring banner */}
          <section className="live-monitoring" aria-label="Live delivery monitoring">
            <div>
              <div className="eyebrow">Live delivery monitoring</div>
              <strong>{liveLocation || shipment.receiverCity}</strong>
              <span>Latest checkpoint: {displayStatus}</span>
            </div>
            <div>
              {forecast && (
                <span
                  className={`live-risk ${forecast.risk.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {forecast.risk}
                </span>
              )}
              <small>Checked {formatDateTime(lastCheckedAt)}</small>
            </div>
          </section>

          {/* ── Leaflet road-following map ── */}
          <section className="tracking-map-panel panel" aria-label="Live delivery map">
            <div className="toolbar">
              <div>
                <div className="eyebrow">Location services</div>
                <h2 className="section-title" style={{ marginTop: 6 }}>
                  Live route map
                </h2>
                <p className="subtle" style={{ margin: "4px 0 0" }}>
                  Vehicle follows actual road route · Auto-refreshes every 15 s ·
                  Last synced {formatDateTime(lastCheckedAt)}
                </p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  className="button secondary compact"
                  onClick={refreshLiveTracking}
                  type="button"
                >
                  Refresh now
                </button>
                <a
                  className="button secondary compact"
                  href={`https://www.google.com/maps/dir/${encodeURIComponent(
                    shipment.senderCity,
                  )}/${encodeURIComponent(shipment.receiverCity)}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>

            {routeGeometryLoading && (
              <div className="cdb-loading" style={{ padding: "18px 0" }}>
                Loading road route…
              </div>
            )}

            {!routeGeometryLoading && !routeGeometry && (
              <div className="cdb-error" style={{ padding: "12px 0" }}>
                Road route unavailable — check sender and receiver city names.
              </div>
            )}

            {routeGeometry && (
              <div
                style={{
                  height: 460,
                  borderRadius: 8,
                  overflow: "hidden",
                  marginTop: 12,
                }}
              >
                <MapContainer
                  center={vehiclePosition ?? routeGeometry.coords[0]}
                  zoom={7}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Full road polyline */}
                  <Polyline
                    positions={routeGeometry.coords}
                    pathOptions={{ color: "#146c94", weight: 5, opacity: 0.8 }}
                  />

                  {/* Origin marker */}
                  <Marker
                    position={routeGeometry.coords[0]}
                    icon={originIcon}
                  >
                    <Popup>
                      <strong>Origin</strong>
                      <div>{shipment.senderCity}</div>
                    </Popup>
                  </Marker>

                  {/* Destination marker */}
                  <Marker
                    position={routeGeometry.coords[routeGeometry.coords.length - 1]}
                    icon={destIcon}
                  >
                    <Popup>
                      <strong>Destination</strong>
                      <div>{shipment.receiverCity}</div>
                    </Popup>
                  </Marker>

                  {/* Vehicle marker — moves along OSRM road waypoints */}
                  {vehiclePosition && (
                    <Marker position={vehiclePosition} icon={vehicleIcon}>
                      <Popup>
                        <strong>Vehicle</strong>
                        <div>
                          {Math.round(vehicleFractionRef.current * 100)}% of
                          route completed
                        </div>
                        <div>Remaining: {remainingDistanceStr}</div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Driver marker — actual backend driver location, separate from vehicle */}
                  {driverLatLng && (
                    <Marker position={driverLatLng} icon={driverIcon}>
                      <Popup>
                        <strong>Driver location</strong>
                        <div>{driver?.name}</div>
                        {driverLocation?.locationName && (
                          <div>{driverLocation.locationName}</div>
                        )}
                        {driverLocation?.timestamp && (
                          <div style={{ fontSize: 11, color: "#6b7f99" }}>
                            Updated:{" "}
                            {formatDateTime(driverLocation.timestamp)}
                          </div>
                        )}
                      </Popup>
                    </Marker>
                  )}

                  {/* Auto-fit bounds to the full route */}
                  <FitBounds positions={mapBounds} />
                </MapContainer>
              </div>
            )}

            <p className="subtle" style={{ marginTop: 8, marginBottom: 0 }}>
              Route: {shipment.senderCity} → {shipment.receiverCity} ·
              Total: {totalDistanceStr} · Remaining: {remainingDistanceStr} ·
              Est. travel time: {estimatedTravelTime}
            </p>
          </section>

          {/* ── Forecast panels ── */}
          {forecast && (
            <section className="grid grid-2" style={{ marginBottom: 18 }}>
              <article className="panel forecast-panel">
                <div className="eyebrow">ETA prediction</div>
                <h2 className="section-title" style={{ marginTop: 6 }}>
                  {forecast.eta}
                </h2>
                <div className="forecast-details">
                  <span>Forecast window</span>
                  <strong>{forecast.remaining}</strong>
                </div>
                <p className="subtle">{forecast.message}</p>
              </article>
              <article className="panel forecast-panel">
                <div className="eyebrow">Delivery forecast</div>
                <h2 className="section-title" style={{ marginTop: 6 }}>
                  {forecast.risk}
                </h2>
                <div className="forecast-details">
                  <span>Progress</span>
                  <strong>{shipment.progress}% complete</strong>
                </div>
                <p className="subtle">
                  Forecasts update from the current delivery status and latest
                  location checkpoint.
                </p>
              </article>
            </section>
          )}

          {/* ── ETA information panel ── */}
          {eta && (
            <section style={{ marginBottom: 18 }}>
              <article className="panel">
                <div className="eyebrow">ETA Information</div>
                <div className="grid grid-2" style={{ marginTop: 16 }}>
                  <div className="schema-box">
                    <strong>Estimated Arrival</strong>
                    <p className="subtle">{eta.estimatedArrival}</p>
                  </div>
                  <div className="schema-box">
                    <strong>Remaining Time</strong>
                    <p className="subtle">{eta.remainingTime}</p>
                  </div>
                  <div className="schema-box">
                    <strong>Shipment Status</strong>
                    <p className="subtle">{String(eta.shipmentStatus).replaceAll("_", " ")}</p>
                  </div>
                  <div className="schema-box">
                    <strong>Delay Reason</strong>
                    <p className="subtle">{eta.delayReason ?? "No Delay"}</p>
                  </div>
                </div>
              </article>
            </section>
          )}

          {/* ── Driver Details panel ── */}
          <section style={{ marginBottom: 20 }}>
            <article className="panel">
              <div className="eyebrow">Driver Details</div>
              {driver ? (
                <div className="grid grid-2" style={{ marginTop: 12 }}>
                  <div className="schema-box">
                    <strong>Name</strong>
                    <p>{driver.name}</p>
                  </div>
                  {driverLocation && (
                    <>
                      <div className="schema-box">
                        <strong>Last Known Location</strong>
                        <p>{driverLocation.locationName || "GPS coordinates available"}</p>
                      </div>
                      <div className="schema-box">
                        <strong>Coordinates</strong>
                        <p>
                          {driverLocation.latitude?.toFixed(4)},{" "}
                          {driverLocation.longitude?.toFixed(4)}
                        </p>
                      </div>
                      <div className="schema-box">
                        <strong>Location Updated</strong>
                        <p>{formatDateTime(driverLocation.timestamp)}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p style={{ marginTop: 12 }}>No driver assigned.</p>
              )}
            </article>
          </section>

          {/* ── Delay Prediction panel ── */}
          {delayPrediction && (
            <section style={{ marginBottom: 20 }}>
              <article className="panel">
                <div className="eyebrow">Delay Prediction</div>
                <div
                  className="schema-box"
                  style={{
                    marginTop: 12,
                    borderLeft:
                      delayPrediction.delayRisk === "HIGH"
                        ? "5px solid red"
                        : delayPrediction.delayRisk === "MEDIUM"
                        ? "5px solid orange"
                        : "5px solid green",
                  }}
                >
                  <strong>Risk Level</strong>
                  <p>{String(delayPrediction.delayRisk)}</p>
                  <strong>Predicted Delay</strong>
                  <p>
                    {delayPrediction.predictedDelayMinutes > 0
                      ? `${delayPrediction.predictedDelayMinutes} min`
                      : "No delay predicted"}
                  </p>
                  <strong>Reason</strong>
                  <p>{delayPrediction.reason}</p>
                </div>
              </article>
            </section>
          )}

          {/* ── Alerts panel ── */}
          {alerts.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <article className="panel">
                <div className="eyebrow">Shipment Alerts</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {alerts.map((alert) => (
                    <li
                      key={alert.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid var(--border, #e5e7eb)",
                        opacity: alert.isRead ? 0.5 : 1,
                      }}
                    >
                      <span>{alert.message}</span>
                      {!alert.isRead && (
                        <button
                          className="button secondary compact"
                          onClick={() => handleMarkAlertRead(alert.id)}
                          style={{ marginLeft: 12, flexShrink: 0 }}
                          type="button"
                        >
                          Mark as read
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            </section>
          )}

          {/* ── Shipment detail + timeline ── */}
          <section className="grid grid-2">
            <div className="panel">
              <div className="toolbar">
                <div>
                  <div className="eyebrow">Tracking number</div>
                  <h2 className="section-title" style={{ marginTop: 6 }}>
                    {shipment.trackingNumber}
                  </h2>
                </div>
                <span className={`badge ${statusClass(displayStatus)}`}>
                  {displayStatus}
                </span>
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
                  <div
                    className="progress-fill"
                    style={{ width: `${shipment.progress}%` }}
                  />
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
              <div className="tracking-stats">
                <div className="stat-box">
                  🚚
                  <h2>{remainingDistanceStr}</h2>
                  <p>Distance Remaining</p>
                  <span>Total route: {totalDistanceStr}</span>
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
                  <li
                    className="timeline-item"
                    key={`${event.status}-${event.timestamp}`}
                  >
                    <div
                      className={`timeline-dot ${
                        event.status === displayStatus ? "live" : ""
                      }`}
                    >
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
                      <div className="timeline-meta">
                        {formatDateTime(event.timestamp)}
                      </div>
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
