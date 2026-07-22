<<<<<<< HEAD
import { useContext, useEffect, useMemo, useState } from "react";
=======
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
>>>>>>> main
import { ShipmentContext } from "../context/shipments";
import { getDeliveryForecast } from "../services/api";

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
<<<<<<< HEAD
  const demoTrackingNumbers = [
  "STP10024591",
  "STP10024592",
  "STP10024593",
  "STP10024594",
  "STP10024595",
];
=======
  const [refreshVersion, setRefreshVersion] = useState(0);
>>>>>>> main

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

<<<<<<< HEAD
  useEffect(() => {
    const refreshTimer = window.setInterval(() => setLastCheckedAt(new Date()), 30_000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
=======
  const refreshLiveTracking = useCallback(() => {
    setLastCheckedAt(new Date());
    setRefreshVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const refreshTimer = window.setInterval(refreshLiveTracking, 30_000);
    return () => window.clearInterval(refreshTimer);
  }, [refreshLiveTracking]);

  useEffect(() => {
>>>>>>> main
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
<<<<<<< HEAD
  }, [shipment]);
=======
  }, [shipment, refreshVersion]);
>>>>>>> main

  const latestEvent = shipment?.history?.at(-1);
  const localForecast = shipment ? getForecast(shipment) : null;
  const forecast = serverForecast
    ? {
        eta: formatDateTime(serverForecast.predictedDeliveryAt),
        remaining: serverForecast.predictedDelayMinutes > 0
          ? `${serverForecast.predictedDelayMinutes} min delay forecast`
          : `${serverForecast.confidencePercentage}% forecast confidence`,
<<<<<<< HEAD
        risk: (serverForecast.riskLevel || "").replaceAll("_", " ") || "UNKNOWN",
=======
        risk: serverForecast.riskLevel.replaceAll("_", " "),
>>>>>>> main
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
        <div className="demo-trackings">

    <span className="demo-title">
        Quick Demo
    </span>

    {demoTrackingNumbers.map(number=>(
        <button
            key={number}
            type="button"
            className="tracking-chip"

            onClick={()=>{
                setTrackingNumber(number);
                setSubmittedTracking(number);
            }}
        >
            {number}
        </button>
    ))}

</div>
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
<<<<<<< HEAD
              <div className="live-pulse">

<span></span>

LIVE

</div>
              <small>Checked {formatDateTime(lastCheckedAt)}</small>
            </div>
          </section>
<section className="journey-card">

<div className="journey-header">

<div>

<h3>Shipment Journey</h3>

<p>Real-time movement across logistics hubs</p>

</div>

<div className="journey-distance">

<strong>640 km</strong>

<span>of 810 km</span>

</div>

</div>

<div className="journey-progress">

<div
className="journey-progress-fill"
style={{width:`${shipment.progress}%`}}
></div>

</div>

<div className="journey-cities">

<div>

<strong>{shipment.senderCity}</strong>

<small>Origin</small>

</div>

<div>

<strong>{latestEvent?.location}</strong>

<small>Current Hub</small>

</div>

<div>

<strong>{shipment.receiverCity}</strong>

<small>Destination</small>

</div>

</div>

</section>
=======
              <small>Checked {formatDateTime(lastCheckedAt)}</small>
            </div>
          </section>

>>>>>>> main
          <section className="tracking-map-panel panel" aria-label="Live delivery map">
            <div className="toolbar">
              <div>
                <div className="eyebrow">Location services</div>
                <h2 className="section-title" style={{ marginTop: 6 }}>Live route map</h2>
<<<<<<< HEAD
              </div>
              <a className="button secondary compact" href={`https://www.google.com/maps/dir/${encodeURIComponent(shipment.senderCity)}/${encodeURIComponent(shipment.receiverCity)}`} rel="noreferrer" target="_blank">Open in Google Maps</a>
            </div>
            <iframe
              className="tracking-map"
              title={`Current shipment location for ${shipment.trackingNumber}`}
              src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
=======
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
>>>>>>> main
            />
            <p className="subtle" style={{ marginBottom: 0 }}>Current checkpoint: {latestEvent?.location || "Location update pending"}. Route: {shipment.senderCity} to {shipment.receiverCity}.</p>
          </section>

          <section className="grid grid-2" style={{ marginBottom: 18 }}>
            <article className="panel forecast-panel">
              <div className="eyebrow">ETA prediction</div>
<<<<<<< HEAD
              <section className="driver-card">

<img
src="https://ui-avatars.com/api/?name=Driver"
alt=""
/>

<div>

<h3>Assigned Driver</h3>

<p>Rahul Sharma</p>

<small>ID : DRV-1024</small>

</div>

<div>

<strong>Vehicle</strong>

<p>MH12AB4587</p>

</div>

<div>

<strong>Contact</strong>

<p>+91 98XXXXXX34</p>

</div>

</section>
              <div className="confidence">

<div className="confidence-title">

AI Delivery Confidence

</div>
<div className="risk-meter">

<div className="risk-title">

Shipment Risk

</div>

<div className="risk-bar">

<div className="risk-fill"></div>

</div>

<span>Low Risk (8%)</span>

</div>

<div className="confidence-bar">

<div

className="confidence-fill"

style={{width:"94%"}}

>

</div>

</div>

<strong>94%</strong>

</div>
              <div className="panel health-card">

<h2>

Delivery Health

</h2>

<ul>

<li>🛰 GPS Connected</li>

<li>🚚 Vehicle Active</li>

<li>🟢 Route Healthy</li>

<li>📡 Last Sync : Just Now</li>

</ul>

</div>

=======
>>>>>>> main
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

<<<<<<< HEAD
<section className="summary-cards">

<div className="summary-card">

📦

<h4>Package</h4>

<p>{shipment.packageType}</p>

</div>

<div className="summary-card">

🚚

<h4>Courier</h4>

<p>ShipTrack Express</p>

</div>

<div className="summary-card">

📍

<h4>Current Hub</h4>

<p>{latestEvent?.location}</p>

</div>

<div className="summary-card">

⭐

<h4>Priority</h4>

<p>{shipment.priority}</p>

</div>
<section className="ai-card">

<h3>AI Shipment Insights</h3>

<div className="ai-grid">

<div>

<h4>Weather</h4>

<p>Clear Route ☀</p>

</div>

<div>

<h4>Traffic</h4>

<p>Moderate</p>

</div>

<div>

<h4>Delay Risk</h4>

<p>Low (6%)</p>

</div>

<div>

<h4>Vehicle Speed</h4>

<p>62 km/h</p>

</div>

</div>

</section>
</section>
=======
>>>>>>> main
          <section className="grid grid-2">
          <div className="panel">
            <div className="toolbar">
              <div>
                <div className="eyebrow">Tracking number</div>
                <div className="delivery-score">

<div>

<h3>Delivery Score</h3>

<span>97%</span>

</div>

<div>

<h3>AI Reliability</h3>

<span>Excellent</span>

</div>

<div>

<h3>Risk Level</h3>

<span className="green">Very Low</span>

</div>

</div>
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

<div className="shipment-stepper">

{shipmentSteps.map((step,index)=>{

const currentIndex=shipmentSteps.indexOf(shipment.status);

const active=index<=currentIndex;

return(

<div className="step-item" key={step}>

<div className={`step-circle ${active?"active":""}`}>

{active?"✓":index+1}

</div>

<div className="step-label">

{step}

</div>

{index!==shipmentSteps.length-1 &&

<div className={`step-line ${index<currentIndex?"active":""}`}>

<div className="line-glow"></div>

</div>

}

</div>

);

})}

</div>

            <div style={{ marginTop: 18 }}>
              <div className="toolbar" style={{ marginBottom: 8 }}>
                <strong>Delivery progress</strong>
                <div className="eta-countdown">

⏳ Estimated Arrival

<h2>08 : 42 : 15</h2>

<p>Hours Remaining</p>

</div>
                <span className="subtle">{shipment.progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${shipment.progress}%` }} />
              </div>
              <div className="status-timeline">
  {shipmentSteps.map((step, index) => {
    const active =
      shipmentSteps.indexOf(shipment.status) >= index;

    return (
      <div
        key={step}
        className={`status-step ${
          active ? "active" : ""
        }`}
      >
        <div className="status-circle">
          {active ? "✓" : index + 1}
        </div>

        <span>{step}</span>
      </div>
    );
  })}
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

<h2>640 km</h2>

<p>Distance Covered</p>

<span>+34 km today</span>

</div>

<div className="stat-box">

📍

<h2>4 / 6</h2>

<p>Stops Completed</p>

<span>2 remaining</span>

</div>

<div className="stat-box">

⏱

<h2>18 hrs</h2>

<p>Total Transit</p>

<span>On Schedule</span>

</div>

<div className="stat-box">

📦

<h2>{shipment.progress}%</h2>

<p>Shipment Progress</p>

<span>Live Updated</span>

</div>

</div>
<div className="current-stage">

<div className="stage-header">

<div>

🚚 CURRENT STAGE

<h2>{shipment.status}</h2>

</div>

<div className="health-badge">

🟢 Healthy

</div>

</div>

<p>

Package is currently moving towards destination.

</p>

<div className="eta-mini">

⏰ ETA : {shipment.eta}

</div>

<div className="vehicle-mini">

🚛 Vehicle : ST-TRK-204

</div>

<div className="driver-mini">

👨 Driver : Rajesh Kumar

</div>

</div>
<section className="kpi-grid">

<div className="kpi">

<h4>Temperature</h4>

<strong>22°C</strong>

</div>

<div className="kpi">

<h4>Humidity</h4>

<strong>48%</strong>

</div>

<div className="kpi">

<h4>Battery</h4>

<strong>92%</strong>

</div>

<div className="kpi">

<h4>GPS Accuracy</h4>

<strong>99%</strong>

</div>

</section>
            <h2 className="section-title">Tracking Timeline</h2>
            <ul className="timeline">
              {shipment.history.map((event) => (
                <li className="timeline-item" key={`${event.status}-${event.timestamp}`}>
                  <div className={`timeline-dot ${event.status===shipment.status?"live":""}`}>

{event.status==="Delivered"
?"✅"

:event.status==="Out for Delivery"
?"🚚"

:event.status==="In Transit"
?"🚛"

:event.status==="Picked Up"
?"📦"

:"📝"}

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
