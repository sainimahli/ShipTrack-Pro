import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ShipmentContext } from "../context/shipments";
import {
  getDeliveryForecast,
  getETA,
  getTrackingLocation,
  getTrackingStatus,
  getTrackingTimeline,
  getDriverLocation,
  predictShipmentDelay,
  getShipmentAlerts,
  markAlertAsRead,
} from "../services/api";

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

function DraggableRouteMap({ shipment, totalDistance, initialProgress }) {
  const progress = initialProgress ?? 0;

  return (
    <div aria-label="Shipment position from the latest backend location" className="interactive-route-map">
      <div className="route-map-city origin"><strong>{shipment.senderCity}</strong><span>Origin</span></div>
      <div className="route-map-city destination"><strong>{shipment.receiverCity}</strong><span>Destination</span></div>
      <div className="interactive-route-line"><span style={{ width: `${progress * 100}%` }} /></div>
      <button aria-label="Shipment position" className="shipment-map-marker" style={{ left: `${progress * 100}%` }} type="button">ðŸšš</button>
      <div className="route-map-hint">Drag the shipment icon to choose its current position · Total: {totalDistance}</div>
    </div>
  );
}

function TrackShipment() {
  const { shipments } = useContext(ShipmentContext);
  const [trackingNumber, setTrackingNumber] = useState(shipments[0]?.trackingNumber || "");
  const [submittedTracking, setSubmittedTracking] = useState(shipments[0]?.trackingNumber || "");
  const [lastCheckedAt, setLastCheckedAt] = useState(() => new Date());
  const [serverForecast, setServerForecast] = useState(null);
  const [eta, setETA] = useState(null);
  console.log("ETA State:", eta);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [liveTracking, setLiveTracking] = useState(null);
  const [driver, setDriver] = useState(null);
  const [, setDriverLocation] = useState(null);
  const [delayPrediction, setDelayPrediction] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

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

  useEffect(() => {
    const refreshTimer = window.setInterval(refreshLiveTracking, 15_000);
    return () => window.clearInterval(refreshTimer);
  }, [refreshLiveTracking, shipment?.trackingNumber]);

  useEffect(() => {

    if (!shipment) return undefined;

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
    if (!shipment) return;

    async function loadMilestone2() {
      try {
        const [delayRes, alertsRes] = await Promise.all([
          predictShipmentDelay(shipment.shipmentId),
          getShipmentAlerts(shipment.shipmentId),
        ]);

        setDelayPrediction(delayRes.data);
        setAlerts(alertsRes.data || []);

        if (shipment.assignedDriverId) {
          setDriver({
            name: `Driver #${shipment.assignedDriverId}`,
            driverId: shipment.assignedDriverId,
          });

          try {
            const locationRes = await getDriverLocation(shipment.assignedDriverId);
            setDriverLocation(locationRes.data);
          } catch (error) {
            console.error("Unable to load driver location", error);
            setDriverLocation(null);
          }
        } else {
          setDriver(null);
          setDriverLocation(null);
        }
      } catch (err) {
        console.error("Milestone 2 data load failed", err);
      }
    }

    void loadMilestone2();
  }, [shipment]);

  useEffect(() => {
    if (!shipment) return undefined;

    let ignoreResponse = false;
    Promise.allSettled([
      getTrackingStatus(shipment.trackingNumber),
      getTrackingTimeline(shipment.trackingNumber),
      getTrackingLocation(shipment.trackingNumber),
    ]).then(([statusResult, timelineResult, locationResult]) => {
      if (ignoreResponse) return;
      const location = locationResult.status === "fulfilled"
        ? locationResult.value.data
        : statusResult.status === "fulfilled"
          ? statusResult.value.data?.latestLocation
          : null;
      setCurrentLocation(location?.latitude != null && location?.longitude != null ? location : null);
      setLiveTracking({
        status: statusResult.status === "fulfilled" ? statusResult.value.data : null,
        location,
        timeline: timelineResult.status === "fulfilled" ? timelineResult.value.data?.events ?? [] : [],
      });
    });

    return () => { ignoreResponse = true; };
  }, [shipment, refreshVersion]);



  const currentLat = currentLocation?.latitude ?? shipment?.currentLatitude ?? null;
  const currentLng = currentLocation?.longitude ?? shipment?.currentLongitude ?? null;
  const markerProgress = 0;

  const handleMarkAlertRead = useCallback(async (alertId) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
      );
    } catch (err) {
      console.error("Could not mark alert as read:", err);
    }
  }, []);

  const serverStatus = liveTracking?.status?.currentStatus?.replaceAll("_", " ");
  const liveLocation = liveTracking?.location?.locationName || currentLocation?.locationName || "Location unavailable";
  const displayStatus = serverStatus || shipment?.status;
  const displayTimeline = liveTracking?.timeline?.length
    ? liveTracking.timeline.map((event) => ({
        status: event.status?.replaceAll("_", " ") || "Update",
        location: event.locationName || event.description || "Location update pending",
        timestamp: event.updatedAt,
      }))
    : shipment?.history || [];
  const forecast = serverForecast
    ? {
        eta: formatDateTime(serverForecast.predictedDeliveryAt),
        remaining: serverForecast.predictedDelayMinutes > 0
          ? `${serverForecast.predictedDelayMinutes} min delay forecast`
          : serverForecast.confidencePercentage != null ? `${serverForecast.confidencePercentage}% forecast confidence` : "N/A",
        risk: serverForecast.riskLevel?.replaceAll("_", " ") || "N/A",
        message: serverForecast.reason || "No forecast details are available.",
      }
    : { eta: "N/A", remaining: "N/A", risk: "N/A", message: "No delivery forecast is available." };
  const totalDistanceKm = "N/A";
  const backendRemainingKm = shipment?.distanceRemainingKm;

  const mapQuery = currentLat != null && currentLng != null ? `${currentLat},${currentLng}` : encodeURIComponent("Location unavailable");
  const remainingDistanceKm = backendRemainingKm != null ? `${Math.round(backendRemainingKm)} km` : "N/A";
  const estimatedTravelTime = "N/A";

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
              <strong>{liveLocation}</strong>
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
                shipment={shipment}
                totalDistance={totalDistanceKm}
              />
            </div>
            <p className="subtle" style={{ marginBottom: 0 }}>Current checkpoint: {liveLocation}. Route: {shipment.senderCity} to {shipment.receiverCity}. Remaining distance: {remainingDistanceKm}. Est. travel time: {estimatedTravelTime}.</p>
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
          <section style={{ marginBottom: 20 }}>
            <article className="panel">
              <div className="eyebrow">Driver Details</div>

              {driver ? (
                  <div className="grid grid-2">
                    <div className="schema-box">
                      <strong>Name</strong>
                      <p>{driver.name}</p>
                    </div>

                    <div className="schema-box">
                      <strong>Phone</strong>
                      <p>{driver.phone}</p>
                    </div>

                    <div className="schema-box">
                      <strong>Vehicle</strong>
                      <p>{driver.vehicleNumber}</p>
                    </div>

                    <div className="schema-box">
                      <strong>Status</strong>
                      <p>{driver.status}</p>
                    </div>
                  </div>
              ) : (
                  <p>No driver assigned.</p>
              )}
            </article>
          </section>
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
                    <p>{delayPrediction.delayRisk}</p>

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
                              type="button"
                              style={{ marginLeft: 12, flexShrink: 0 }}
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
