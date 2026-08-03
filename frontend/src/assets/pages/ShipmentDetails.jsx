import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { ShipmentContext } from "../context/shipments";
import { getRouteHistory } from "../services/api";
import RouteHistoryTimeline from "../components/route-history/RouteHistoryTimeline";
import RouteHistoryMap from "../components/route-history/RouteHistoryMap";
import LocationList from "../components/route-history/LocationList";

/**
 * Shipment Details Page exposing summary blocks, timelines, maps, and coordinates log.
 */
function ShipmentDetails() {
  const { trackingNumber } = useParams();
  const { shipments, loading } = useContext(ShipmentContext);
  const [routeHistory, setRouteHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const shipment = shipments.find((s) => s.trackingNumber === trackingNumber);

  useEffect(() => {
    if (trackingNumber) {
      setHistoryLoading(true);
      setHistoryError("");
      getRouteHistory(trackingNumber)
        .then((res) => {
          setRouteHistory(res.data || []);
        })
        .catch((err) => {
          console.error("Error loading route history:", err);
          setHistoryError("Unable to load route history details.");
        })
        .finally(() => {
          setHistoryLoading(false);
        });
    }
  }, [trackingNumber]);

  if (loading && !shipment) {
    return (
      <div className="page" style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
        <p className="subtle">Loading shipment details...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Shipment Not Found</h1>
            <p className="subtle">Verify the tracking number and try again.</p>
          </div>
        </div>
        <div className="panel" style={{ padding: "30px", textAlign: "center" }}>
          <p style={{ color: "#64748b", marginBottom: "20px" }}>
            The shipment with tracking number <strong>{trackingNumber}</strong> could not be found.
          </p>
          <Link to="/shipments" className="button primary">
            Back to Shipments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <Link to="/shipments" style={{ textDecoration: "none", color: "#2563eb", fontWeight: "bold" }}>
              &larr; Back to Shipments
            </Link>
          </div>
          <h1 style={{ marginTop: "8px" }}>Shipment {shipment.trackingNumber}</h1>
          <p className="subtle">Detailed information and route path history.</p>
        </div>
        <span className={`badge ${shipment.status.toLowerCase().replaceAll(" ", "-")}`}>
          {shipment.status}
        </span>
      </div>

      <div className="grid grid-3" style={{ gap: "20px", marginBottom: "20px", alignItems: "stretch" }}>
        <div className="panel" style={{ padding: "20px" }}>
          <h3 className="section-title" style={{ marginBottom: "12px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
            Route & Delivery
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <div>
              <span className="subtle">Origin:</span> <strong>{shipment.senderCity}</strong>
            </div>
            <div>
              <span className="subtle">Destination:</span> <strong>{shipment.receiverCity}</strong>
            </div>
            <div>
              <span className="subtle">Deliver To:</span> <span style={{ color: "#334155" }}>{shipment.deliveryAddress}</span>
            </div>
            <div>
              <span className="subtle">ETA:</span> <strong>{shipment.eta || "Under review"}</strong>
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: "20px" }}>
          <h3 className="section-title" style={{ marginBottom: "12px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
            Parties
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <div>
              <span className="subtle">Sender:</span> <strong>{shipment.senderName}</strong>
            </div>
            <div>
              <span className="subtle">Receiver:</span> <strong>{shipment.receiverName}</strong>
            </div>
            <div>
              <span className="subtle">Priority:</span> <span className={`badge ${shipment.priority.toLowerCase()}`} style={{ display: "inline-block" }}>{shipment.priority}</span>
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: "20px" }}>
          <h3 className="section-title" style={{ marginBottom: "12px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
            Package & Progress
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <div>
              <span className="subtle">Package Type:</span> <strong>{shipment.packageType}</strong>
            </div>
            <div>
              <span className="subtle">Weight:</span> <strong>{shipment.weight}</strong>
            </div>
            <div>
              <span className="subtle">Progress:</span> <strong>{shipment.progress}% Complete</strong>
            </div>
          </div>
        </div>
      </div>

      {historyError && <div className="alert danger" style={{ marginBottom: "20px" }}>{historyError}</div>}

      <div className="grid grid-2" style={{ alignItems: "start", gap: "20px" }}>
        <div>
          <RouteHistoryTimeline history={routeHistory} shipment={shipment} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <RouteHistoryMap history={routeHistory} shipment={shipment} />
          <LocationList history={routeHistory} />
        </div>
      </div>
    </div>
  );
}

export default ShipmentDetails;
