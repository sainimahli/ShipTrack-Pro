import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ShipmentContext } from "../context/shipments";

import { getDeliveryForecast, getETA } from "../services/api";
import {
  calculateRoute,
  
  getShipmentAlerts,
  getShipments,
  getTrackingLocation,
  getTrackingStatus,
  getTrackingTimeline,
  markAlertAsRead,
  predictShipmentDelay,
} from "../services/api";

const CITY_COORDS = {
  mumbai: [19.076, 72.8777], delhi: [28.6139, 77.209], "new delhi": [28.6139, 77.209],
  bangalore: [12.9716, 77.5946], bengaluru: [12.9716, 77.5946], hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707], kolkata: [22.5726, 88.3639], pune: [18.5204, 73.8567],
  ahmedabad: [23.0225, 72.5714], jaipur: [26.9124, 75.7873], surat: [21.1702, 72.8311],
  lucknow: [26.8467, 80.9462], nagpur: [21.1458, 79.0882], indore: [22.7196, 75.8577],
  bhopal: [23.2599, 77.4126], visakhapatnam: [17.6868, 83.2185], patna: [25.5941, 85.1376],
  kochi: [9.9312, 76.2673], chandigarh: [30.7333, 76.7794], coimbatore: [11.0168, 76.9558],
  guwahati: [26.1445, 91.7362], vadodara: [22.3072, 73.1812], rajkot: [22.3039, 70.8022],
  madurai: [9.9252, 78.1198], raipur: [21.2514, 81.6296], ranchi: [23.3441, 85.3096],
  mysore: [12.2958, 76.6394], mysuru: [12.2958, 76.6394], gurgaon: [28.4595, 77.0266],
  gurugram: [28.4595, 77.0266], noida: [28.5355, 77.391], agra: [27.1767, 78.0081],
  varanasi: [25.3176, 82.9739], amritsar: [31.634, 74.8723], jalandhar: [31.326, 75.5762],
  ludhiana: [30.901, 75.8573], nashik: [19.9975, 73.7898], aurangabad: [19.8762, 75.3433],
  vijayawada: [16.5062, 80.648], warangal: [17.9784, 79.5941], mangalore: [12.9141, 74.856],
  hubli: [15.3647, 75.124], belgaum: [15.8497, 74.4977], shimla: [31.1048, 77.1734],
  dehradun: [30.3165, 78.0322], bhubaneswar: [20.2961, 85.8245], jammu: [32.7266, 74.857],
  srinagar: [34.0837, 74.7973], panaji: [15.4909, 73.8278], thiruvananthapuram: [8.5241, 76.9366],
  kollam: [8.8932, 76.6141], kozhikode: [11.2588, 75.7804], salem: [11.6643, 78.146],
  tiruchirappalli: [10.7905, 78.7047], tirunelveli: [8.7139, 77.7567], erode: [11.341, 77.7172],
  tiruppur: [11.1085, 77.3411], jodhpur: [26.2389, 73.0243], udaipur: [24.5854, 73.7125],
  kota: [25.2138, 75.8648], ajmer: [26.4499, 74.6399], bikaner: [28.0229, 73.3119],
  jabalpur: [23.1815, 79.9864], gwalior: [26.2183, 78.1828], ujjain: [23.1765, 75.7885],
  jamshedpur: [22.8046, 86.2029], bokaro: [23.6693, 86.1511], siliguri: [26.7271, 88.3953],
  agartala: [23.8315, 91.2868], imphal: [24.817, 93.9368], shillong: [25.5788, 91.8933],
  aizawl: [23.7271, 92.7176], kohima: [25.6751, 94.1086], itanagar: [27.0844, 93.6053],
  gangtok: [27.3389, 88.6065], portblair: [11.6234, 92.7265],
};

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

function localRoute(originCity, destinationCity) {
  const o = CITY_COORDS[originCity?.trim().toLowerCase()];
  const d = CITY_COORDS[destinationCity?.trim().toLowerCase()];
  if (!o || !d) return null;
  const distanceKm = Math.round(haversineKm(o[0], o[1], d[0], d[1]) * 10) / 10;
  const estimatedMinutes = Math.round((distanceKm / 60) * 60);
  return { distanceKm, estimatedTravelTime: formatDuration(estimatedMinutes) };
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
  const [routeData, setRouteData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [liveError, setLiveError] = useState("");



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
  const mapQuery = shipment
    ? encodeURIComponent(liveLocation || latestEvent?.location || `${shipment.receiverCity}, India`)
    : "";

  const totalDistanceKm = routeData ? `${routeData.distanceKm} km` : "Calculating...";
  const estimatedTravelTime = routeData ? routeData.estimatedTravelTime : "Calculating...";

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
            <iframe
              className="tracking-map"
              key={`${shipment.trackingNumber}-${refreshVersion}`}
              title={`Current shipment location for ${shipment.trackingNumber}`}
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed&refresh=${refreshVersion}`}

            />
            <p className="subtle" style={{ marginBottom: 0 }}>Current checkpoint: {liveLocation || latestEvent?.location || "Location update pending"}. Route: {shipment.senderCity} to {shipment.receiverCity}. Total distance: {totalDistanceKm}. Est. travel time: {estimatedTravelTime}.</p>
          </section>

          {liveError && <div className="alert error" style={{ marginBottom: 18 }}>{liveError}</div>}

          <section className="panel" style={{ marginBottom: 18 }} aria-label="Shipment alerts">
            <div className="toolbar">
              <div><div className="eyebrow">Notification panel</div><h2 className="section-title" style={{ marginTop: 6 }}>Shipment alerts</h2></div>
              <span className="subtle">Auto-refreshed with live tracking</span>
            </div>
            {alerts.length === 0 ? <p className="subtle" style={{ marginBottom: 0 }}>No shipment alerts at this time.</p> : (
              <div className="notification-items">
                {alerts.map((alert) => <button className={`notification-item${alert.isRead ? "" : " unread"}`} key={alert.id} onClick={async () => {
                  if (alert.isRead) return;
                  try {
                    await markAlertAsRead(alert.id);
                    setAlerts((items) => items.map((item) => item.id === alert.id ? { ...item, isRead: true } : item));
                  } catch { setLiveError("The alert could not be marked as read."); }
                }} type="button">
                  <span className="notification-item-title">{alert.alertType?.replaceAll("_", " ") || "Shipment alert"}</span>
                  <span className="notification-item-message">{alert.message}</span>
                  <span className="notification-item-time">{formatDateTime(alert.createdAt)}</span>
                </button>)}
              </div>
            )}
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
                  <h2>{totalDistanceKm}</h2>
                  <p>Total Route Distance</p>
                  <span>{shipment.progress}% covered</span>
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
