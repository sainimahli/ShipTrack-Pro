import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ShipmentContext } from "../context/shipments";
import { getRouteHistory, updateTrackingLocation, updateTrackingStatus } from "../services/api";

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}


function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function RouteHistory() {
  const { shipments, refetch } = useContext(ShipmentContext);
  const [selectedTracking, setSelectedTracking] = useState(shipments[0]?.trackingNumber || "");
  const [submittedTracking, setSubmittedTracking] = useState(shipments[0]?.trackingNumber || "");
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

  const fetchHistory = useCallback(async (trackingNo) => {
    if (!trackingNo) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await getRouteHistory(trackingNo);
      setRouteHistory(response.data?.events || []);
    } catch (err) {
      setHistoryError(err.response?.data?.message || "Failed to load route history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    async function run() {
      if (shipment?.trackingNumber) {
        fetchHistory(shipment.trackingNumber);
      } else {
        setRouteHistory([]);
      }
    }
    run();
  }, [shipment?.trackingNumber, fetchHistory]);


  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmittedTracking(selectedTracking);
  };

  const handleSimulateCheckpoint = async () => {
    if (!shipment || shipment.progress >= 100 || shipment.status === "Delivered") return;
    setSimulating(true);
    try {
      const origLat = shipment.originLatitude ?? 12.9716;
      const origLng = shipment.originLongitude ?? 77.5946;
      const destLat = shipment.destinationLatitude ?? 26.8467;
      const destLng = shipment.destinationLongitude ?? 80.9462;

      const currentCount = routeHistory.length;
      const nextProgress = Math.min(1, (currentCount + 1) * 0.15);
      const latitude = origLat + (destLat - origLat) * nextProgress;
      const longitude = origLng + (destLng - origLng) * nextProgress;
      const remainingKm = Math.round(haversineKm(latitude, longitude, destLat, destLng) * 10) / 10;

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
      await fetchHistory(shipment.trackingNumber);
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Location Audit & Audit Logs</div>
          <h1>Route History & Checkpoints</h1>
          <p className="subtle">
            Select or enter a tracking number to inspect recorded route checkpoints, location logs, and status history.
          </p>
        </div>
      </div>

      <section className="panel" style={{ marginBottom: 18 }}>
        <form className="toolbar" onSubmit={handleSubmit}>
          <div className="form-field" style={{ flex: "1 1 340px" }}>
            <label htmlFor="routeHistoryTracking">Select or enter tracking number</label>
            <input
              className="input"
              id="routeHistoryTracking"
              list="shipment-suggestions"
              onChange={(e) => setSelectedTracking(e.target.value)}
              placeholder="e.g. STP10024591"
              required
              value={selectedTracking}
            />
            <datalist id="shipment-suggestions">
              {shipments.map((s) => (
                <option key={s.trackingNumber} value={s.trackingNumber}>
                  {s.trackingNumber} ({s.senderCity} → {s.receiverCity})
                </option>
              ))}
            </datalist>
          </div>
          <button className="button primary" type="submit">
            View Route History
          </button>
        </form>
      </section>

      {!shipment && (
        <div className="empty-state">
          No shipment found for "{submittedTracking}". Please select a valid tracking number above.
        </div>
      )}

      {shipment && (
        <>
          <div className="grid grid-3" style={{ marginBottom: 18 }}>
            <div className="stat-box" style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 8 }}>
              <span className="subtle">Selected Shipment</span>
              <h3 style={{ margin: "4px 0 0", fontSize: 20 }}>{shipment.trackingNumber}</h3>
              <p className="subtle" style={{ margin: "4px 0 0", fontSize: 13 }}>
                {shipment.senderCity} → {shipment.receiverCity}
              </p>
            </div>
            <div className="stat-box" style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 8 }}>
              <span className="subtle">Total Checkpoints</span>
              <h3 style={{ margin: "4px 0 0", fontSize: 22 }}>{routeHistory.length}</h3>
              <p className="subtle" style={{ margin: "4px 0 0", fontSize: 13 }}>
                Log entries recorded
              </p>
            </div>
            <div className="stat-box" style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 8 }}>
              <span className="subtle">Current Status & Progress</span>
              <h3 style={{ margin: "4px 0 0", fontSize: 20 }}>
                {shipment.status} ({shipment.progress}%)
              </h3>
              <p className="subtle" style={{ margin: "4px 0 0", fontSize: 13 }}>
                ETA: {shipment.eta || "N/A"}
              </p>
            </div>
          </div>

          <section className="panel">
            <div className="toolbar" style={{ marginBottom: 16 }}>
              <div>
                <div className="eyebrow">Checkpoint Logs</div>
                <h2 className="section-title" style={{ marginTop: 6 }}>Location History Log</h2>
                <p className="subtle" style={{ margin: "4px 0 0" }}>
                  Chronological log of recorded shipment locations, check-in descriptions, and coordinates.
                </p>
              </div>
              <button
                className="button secondary compact"
                disabled={simulating || shipment.progress >= 100 || shipment.status === "Delivered"}
                onClick={handleSimulateCheckpoint}
                type="button"
              >
                {simulating
                  ? "Updating..."
                  : shipment.progress >= 100 || shipment.status === "Delivered"
                    ? "✓ Route Completed"
                    : "+ Simulate Checkpoint"}
              </button>
            </div>

            {historyLoading && <div className="subtle" style={{ padding: 12 }}>Loading route history...</div>}

            {historyError && (
              <div className="empty-state" style={{ color: "#ef4444", padding: 12 }}>
                {historyError}
              </div>
            )}

            {!historyLoading && !historyError && routeHistory.length === 0 && (
              <div className="empty-state" style={{ padding: 16 }}>
                No route history recorded for this shipment yet. Click "+ Simulate Checkpoint" to log a new location.
              </div>
            )}

            {!historyLoading && !historyError && routeHistory.length > 0 && (
              <ul className="timeline" style={{ marginTop: 12 }}>
                {routeHistory.map((item, index) => (
                  <li className="timeline-item" key={item.updatedAt || index}>
                    <div className="timeline-dot live">📍</div>
                    <div>
                      <div className="timeline-title">
                        {item.locationName || `Checkpoint ${index + 1}`}
                        {item.status && (
                          <span className="badge compact" style={{ marginLeft: 8, fontSize: 11 }}>
                            {item.status}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="timeline-meta" style={{ marginTop: 2 }}>{item.description}</div>
                      )}
                      {item.latitude != null && item.longitude != null && (
                        <div className="subtle" style={{ fontSize: 12, marginTop: 2 }}>
                          Coordinates: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </div>
                      )}
                      <div className="timeline-meta" style={{ marginTop: 4 }}>
                        Logged by {item.updatedBy || "SYSTEM"} · {formatDateTime(item.updatedAt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default RouteHistory;
