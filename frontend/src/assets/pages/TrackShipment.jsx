import { useContext, useEffect, useMemo, useState } from "react";
import { ShipmentContext } from "../context/shipments";
import { getDeliveryForecast } from "../services/api";

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

function TrackShipment() {
  const { shipments } = useContext(ShipmentContext);
  const [trackingNumber, setTrackingNumber] = useState(shipments[0]?.trackingNumber || "");
  const [submittedTracking, setSubmittedTracking] = useState(shipments[0]?.trackingNumber || "");
  const [lastCheckedAt, setLastCheckedAt] = useState(() => new Date());
  const [serverForecast, setServerForecast] = useState(null);

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

  useEffect(() => {
    const refreshTimer = window.setInterval(() => setLastCheckedAt(new Date()), 30_000);
    return () => window.clearInterval(refreshTimer);
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
  const mapQuery = shipment
    ? encodeURIComponent(latestEvent?.location || `${shipment.receiverCity}, India`)
    : "";

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
              <strong>{latestEvent?.location || shipment.receiverCity}</strong>
              <span>Latest checkpoint: {latestEvent?.status || shipment.status}</span>
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
              </div>
              <a className="button secondary compact" href={`https://www.google.com/maps/dir/${encodeURIComponent(shipment.senderCity)}/${encodeURIComponent(shipment.receiverCity)}`} rel="noreferrer" target="_blank">Open in Google Maps</a>
            </div>
            <iframe
              className="tracking-map"
              title={`Current shipment location for ${shipment.trackingNumber}`}
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
            />
            <p className="subtle" style={{ marginBottom: 0 }}>Current checkpoint: {latestEvent?.location || "Location update pending"}. Route: {shipment.senderCity} to {shipment.receiverCity}.</p>
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
        </>
      )}
    </div>
  );
}

export default TrackShipment;
