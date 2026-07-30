import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ShipmentContext } from "../context/shipments";
import { calculateRoute, getDeliveryForecast, getETA, getTrackingLocation, updateTrackingLocation, updateTrackingStatus } from "../services/api";

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

function DraggableRouteMap({ shipment, totalDistance, initialProgress, onPositionChange }) {
  const [progress, setProgress] = useState(initialProgress);
  const origin = DEFAULT_CENTER;
  const destination = DEFAULT_CENTER;

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
    const refreshTimer = window.setInterval(refreshLiveTracking, 15_000);
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


  }, [shipment, refreshVersion]);

  useEffect(() => {
    if (!shipment) {
      setCurrentLocation(null);
      return undefined;
    }

    let ignoreResponse = false;
    getTrackingLocation(shipment.trackingNumber)
      .then((response) => {
        if (!ignoreResponse) {
          const loc = response.data;
          if (loc && loc.latitude != null && loc.longitude != null) {
            setCurrentLocation({ latitude: loc.latitude, longitude: loc.longitude });
          }
        }
      })
      .catch(() => {
        if (!ignoreResponse) setCurrentLocation(null);
      });

    return () => {
      ignoreResponse = true;
    };
  }, [shipment?.trackingNumber, refreshVersion]);

   useEffect(() => {
     if (!shipment?.senderCity || !shipment?.receiverCity) {
       setRouteData(null);
       return undefined;
     }

    const destLat = shipment.destinationLatitude ?? 26.8467;
    const destLng = shipment.destinationLongitude ?? 80.9462;
    const origLat = shipment.originLatitude ?? 12.9716;
    const origLng = shipment.originLongitude ?? 77.5946;

    let ignoreResponse = false;
    Promise.all([
      calculateRoute({
        originLatitude: origLat,
        originLongitude: origLng,
        destinationLatitude: destLat,
        destinationLongitude: destLng,
      }),
      calculateRoute({
        trackingNumber: shipment.trackingNumber,
        originLatitude: origLat,
        originLongitude: origLng,
        destinationLatitude: destLat,
        destinationLongitude: destLng,
      }),
    ])
      .then(([totalResponse, remainingResponse]) => {
        if (!ignoreResponse) {
          setRouteData({ 
            total: totalResponse.data, 
            remaining: remainingResponse.data,
            originCoords: totalResponse.data.originCoords || DEFAULT_CENTER,
            destinationCoords: totalResponse.data.destinationCoords || DEFAULT_CENTER
          });
        }
      })
      .catch(() => { /* route calculation error handle */ });

    return () => {
      ignoreResponse = true;
    };
  }, [shipment?.senderCity, shipment?.receiverCity, shipment?.trackingNumber]);

  const mapOrigin = useMemo(() => routeData?.originCoords || DEFAULT_CENTER, [routeData]);
  const mapDestination = useMemo(() => routeData?.destinationCoords || DEFAULT_CENTER, [routeData]);

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
    if (!shipment || !routeData || !mapOrigin || !mapDestination || shipment.status === "Delivered") {
      return undefined;
    }

  const latestEvent = shipment?.history?.at(-1);
  const serverStatus = liveTracking?.status?.currentStatus?.replaceAll("_", " ");
  const liveLocation = liveTracking?.location?.locationName;
  const displayStatus = serverStatus || shipment?.status;
  const displayTimeline = liveTracking?.timeline?.length
    ? liveTracking.timeline.map((event) => ({
        status: event.status?.replaceAll("_", " ") || "Update",
        location: event.locationName || event.description || "Location update pending",
        timestamp: event.updatedAt,
      }))
    : shipment?.history || [];
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
                  Auto-refreshes every 30 seconds · Last synced {formatDateTime(lastCheckedAt)}
                </p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button className="button secondary compact" onClick={refreshLiveTracking} type="button">
                  Refresh now
                </button>
                <a className="button secondary compact" href={`https://www.google.com/maps/dir/${encodeURIComponent(shipment.senderCity)}/${encodeURIComponent(shipment.receiverCity)}`} rel="noreferrer" target="_blank">Open in Google Maps</a>
              </div>
            </div>
            <div className="map-with-marker">
              <iframe
                className="tracking-map"
                key={`${shipment.trackingNumber}-${refreshVersion}-${currentLat ?? 0}-${currentLng ?? 0}`}
                title={`Current shipment location for ${shipment.trackingNumber}`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed&refresh=${refreshVersion}`}
              />
              <DraggableRouteMap
                initialProgress={markerProgress}
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
