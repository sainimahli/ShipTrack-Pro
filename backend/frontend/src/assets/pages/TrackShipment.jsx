import { useContext, useMemo, useState } from "react";
import { ShipmentContext } from "../context/shipments";

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function TrackShipment() {
  const { shipments } = useContext(ShipmentContext);
  const [trackingNumber, setTrackingNumber] = useState(shipments[0]?.trackingNumber || "");
  const [submittedTracking, setSubmittedTracking] = useState(shipments[0]?.trackingNumber || "");

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
      )}
    </div>
  );
}

export default TrackShipment;
