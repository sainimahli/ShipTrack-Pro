import { useState, useContext, useMemo } from "react";
import { getRouteHistory, saveRouteHistory } from "../services/api";
import { AuthContext } from "../context/auth";
import { ShipmentContext } from "../context/shipments";
import { getCoords } from "../services/coordinates";
import SearchShipmentId from "../components/route-history/SearchShipmentId";
import RouteHistoryTimeline from "../components/route-history/RouteHistoryTimeline";
import RouteHistoryMap from "../components/route-history/RouteHistoryMap";
import LocationList from "../components/route-history/LocationList";

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function calculateTotalDistance(historyPoints) {
  if (!historyPoints || historyPoints.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < historyPoints.length - 1; i++) {
    const p1 = historyPoints[i];
    const p2 = historyPoints[i + 1];
    if (p1.latitude != null && p1.longitude != null && p2.latitude != null && p2.longitude != null) {
      total += calculateHaversineDistance(
        Number(p1.latitude), Number(p1.longitude),
        Number(p2.latitude), Number(p2.longitude)
      );
    }
  }
  return total;
}

function RouteStatistics({ history = [], shipment }) {
  const points = useMemo(() => {
    if (history && history.length > 0) {
      return history;
    }
    return [];
  }, [history]);

  const progress = shipment?.progress ?? 0;
  const filledBlocks = Math.round(progress / 10);
  const emptyBlocks = 10 - filledBlocks;
  const barStr = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);

  const startCoords = shipment ? getCoords(shipment.senderCity) : { lat: 13.0827, lng: 80.2707 };
  const destCoords = shipment ? getCoords(shipment.receiverCity) : { lat: 13.0827, lng: 80.2707 };
  
  const totalCheckpoints = points.length;
  
  const distanceCovered = useMemo(() => {
    if (points.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (p1.latitude != null && p1.longitude != null && p2.latitude != null && p2.longitude != null) {
        total += calculateHaversineDistance(
          Number(p1.latitude), Number(p1.longitude),
          Number(p2.latitude), Number(p2.longitude)
        );
      }
    }
    return total;
  }, [points]);

  const remainingDistance = useMemo(() => {
    if (!shipment) return 0;
    const latestPoint = points.length > 0 ? points[points.length - 1] : null;
    const currentLat = latestPoint ? Number(latestPoint.latitude) : startCoords.lat;
    const currentLng = latestPoint ? Number(latestPoint.longitude) : startCoords.lng;
    return calculateHaversineDistance(currentLat, currentLng, destCoords.lat, destCoords.lng);
  }, [points, shipment, startCoords, destCoords]);

  const travelTimeStr = useMemo(() => {
    if (points.length < 2) return "0 mins";
    const durationMs = new Date(points[points.length - 1].timestamp) - new Date(points[0].timestamp);
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} mins`;
  }, [points]);

  return (
    <div className="panel" style={{ padding: "20px" }}>
      <h3 className="section-title" style={{ marginBottom: "16px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
        📊 Route Statistics
      </h3>
      <div className="grid grid-2" style={{ gap: "16px", marginBottom: "16px" }}>
        <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <span className="subtle" style={{ fontSize: "11px", display: "block" }}>Total Checkpoints</span>
          <strong>{totalCheckpoints} Visited</strong>
        </div>
        <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <span className="subtle" style={{ fontSize: "11px", display: "block" }}>Distance Covered</span>
          <strong>{distanceCovered.toFixed(1)} km</strong>
        </div>
        <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <span className="subtle" style={{ fontSize: "11px", display: "block" }}>Remaining Distance</span>
          <strong>{remainingDistance.toFixed(1)} km</strong>
        </div>
        <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <span className="subtle" style={{ fontSize: "11px", display: "block" }}>Total Travel Time</span>
          <strong>{travelTimeStr}</strong>
        </div>
      </div>
      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
        <span className="subtle" style={{ fontSize: "11px", display: "block" }}>Route Completion Progress</span>
        <div style={{ marginTop: "6px", fontFamily: "monospace", fontSize: "14px", color: "#0f172a", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
          <span>Progress: <strong>{progress}%</strong></span>
          <span style={{ color: "#2563eb", letterSpacing: "2px" }}>[{barStr}]</span>
        </div>
      </div>
    </div>
  );
}


/**
 * Route History Lookup and Simulation Page.
 */
function RouteHistoryPage() {
  const { auth } = useContext(AuthContext);
  const { shipments } = useContext(ShipmentContext);
  const [shipmentId, setShipmentId] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Simulator State
  const [simLocation, setSimLocation] = useState("");
  const [simStatus, setSimStatus] = useState("In Transit");
  const [simLoading, setSimLoading] = useState(false);
  const [simMessage, setSimMessage] = useState("");

  // Filters State
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState(["Created", "Awaiting Transit", "In Transit", "Out for Delivery", "Delivered"]);


  const role = auth?.user?.role;
  const isOperatorOrAdmin = role === "LOGISTICS_OPERATOR" || role === "ADMINISTRATOR" || role === "SUPPORT_AGENT";
  const shipment = shipments.find((s) => s.trackingNumber === shipmentId);

  const filteredHistory = useMemo(() => {
    let result = [...history];

    if (fromDate) {
      const from = new Date(fromDate);
      result = result.filter(point => new Date(point.timestamp) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter(point => new Date(point.timestamp) <= to);
    }

    if (selectedStatuses.length > 0) {
      result = result.filter(point => {
        const displayStatus = point.status || "In Transit";
        return selectedStatuses.includes(displayStatus);
      });
    }

    return result;
  }, [history, fromDate, toDate, selectedStatuses]);

  const dynamicETA = useMemo(() => {
    if (!shipment) return "Under review";
    if (shipment.status === "Delivered") return "Delivered Successfully";
    
    const speedKmph = shipment.vehicle?.speedKmph || 60;
    const latestPoint = filteredHistory.length > 0 ? filteredHistory[filteredHistory.length - 1] : null;
    const destCoords = getCoords(shipment.receiverCity);
    const startCoords = getCoords(shipment.senderCity);
    const currentLat = latestPoint ? Number(latestPoint.latitude) : startCoords.lat;
    const currentLng = latestPoint ? Number(latestPoint.longitude) : startCoords.lng;
    const remDist = calculateHaversineDistance(currentLat, currentLng, destCoords.lat, destCoords.lng);
    
    const travelHours = remDist / speedKmph;
    const trafficDelayMinutes = shipment.traffic?.delayMinutes || 0;
    const totalRemainingMinutes = Math.round(travelHours * 60 + trafficDelayMinutes);

    if (totalRemainingMinutes === 0) return shipment.eta || "Under review";

    const etaDate = new Date();
    etaDate.setMinutes(etaDate.getMinutes() + totalRemainingMinutes);

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(etaDate);
  }, [shipment, filteredHistory]);

  const fetchHistory = async (id) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getRouteHistory(id);
      setHistory(response.data || []);
      setShipmentId(id);
    } catch (err) {
      console.error("Error fetching route history:", err);
      setError(err.response?.data?.message || "Failed to load route history. Please verify the shipment ID.");
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateUpdate = async (e) => {
    e.preventDefault();
    if (!simLocation.trim()) return;

    setSimLoading(true);
    setSimMessage("");
    try {
      const coords = getCoords(simLocation.trim());
      const payload = {
        shipmentId: shipmentId,
        latitude: coords.lat,
        longitude: coords.lng,
        locationName: simLocation.trim(),
        status: simStatus,
        timestamp: new Date().toISOString()
      };
      
      await saveRouteHistory(payload);
      setSimMessage("Location update successfully recorded!");
      setSimLocation("");
      // Refresh history
      fetchHistory(shipmentId);
    } catch (err) {
      console.error("Simulation error:", err);
      setSimMessage("Error: " + (err.response?.data?.message || "Failed to save route point."));
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Visibility & Tracking</div>
          <h1>Route History Tracking</h1>
          <p className="subtle">Look up and trace the entire location history path of any shipment.</p>
        </div>
      </div>

      <SearchShipmentId onSearch={fetchHistory} isLoading={isLoading} />

      {error && <div className="alert danger" style={{ marginBottom: "20px" }}>{error}</div>}

      {shipmentId && !isLoading && (
        <div className="panel" style={{ padding: "20px", marginBottom: "20px" }}>
          <h3 className="section-title" style={{ marginBottom: "12px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
            🔍 Filter Route History
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }}>
            <div className="form-field" style={{ margin: 0, flex: "1 1 200px" }}>
              <label htmlFor="fromDate" style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>From Date</label>
              <input 
                type="date" 
                id="fromDate" 
                className="input" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
              />
            </div>
            <div className="form-field" style={{ margin: 0, flex: "1 1 200px" }}>
              <label htmlFor="toDate" style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>To Date</label>
              <input 
                type="date" 
                id="toDate" 
                className="input" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)} 
              />
            </div>
            <div style={{ flex: "1 1 300px" }}>
              <span style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#475569", marginBottom: "6px" }}>Filter by Status</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {["Created", "Awaiting Transit", "In Transit", "Out for Delivery", "Delivered"].map(status => {
                  const isChecked = selectedStatuses.includes(status);
                  return (
                    <label key={status} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer", background: isChecked ? "#eff6ff" : "#f8fafc", padding: "4px 8px", borderRadius: "6px", border: isChecked ? "1px solid #2563eb" : "1px solid #cbd5e1" }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => {
                          if (isChecked) {
                            setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                          } else {
                            setSelectedStatuses([...selectedStatuses, status]);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      />
                      {status}
                    </label>
                  );
                })}
              </div>
            </div>
            <button 
              type="button" 
              className="button secondary compact" 
              onClick={() => {
                setFromDate("");
                setToDate("");
                setSelectedStatuses(["Created", "Awaiting Transit", "In Transit", "Out for Delivery", "Delivered"]);
              }}
              style={{ height: "38px", cursor: "pointer" }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {shipmentId && !isLoading && shipment && (
        <div className="grid grid-3" style={{ gap: "20px", marginBottom: "20px" }}>
          <div className="panel" style={{ padding: "16px 20px" }}>
            <span className="subtle" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: "bold" }}>Route Overview</span>
            <div style={{ fontSize: "16px", fontWeight: "bold", marginTop: "4px", color: "#1e293b" }}>
              📍 {shipment.senderCity} &rarr; {shipment.receiverCity}
            </div>
          </div>
          <div className="panel" style={{ padding: "16px 20px" }}>
            <span className="subtle" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: "bold" }}>ETA / Expected Delivery</span>
            <div style={{ fontSize: "16px", fontWeight: "bold", marginTop: "4px", color: "#1e293b" }}>
              📅 {dynamicETA}
            </div>
          </div>
          <div className="panel" style={{ padding: "16px 20px" }}>
            <span className="subtle" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: "bold" }}>Traveled Distance</span>
            <div style={{ fontSize: "16px", fontWeight: "bold", marginTop: "4px", color: "#2563eb" }}>
              ⚡ {calculateTotalDistance(filteredHistory).toFixed(1)} km
            </div>
          </div>
        </div>
      )}

      {shipmentId && !isLoading && (
        <div className="grid grid-2" style={{ alignItems: "start", gap: "20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <RouteHistoryTimeline history={filteredHistory} shipment={shipment} />
            
            {isOperatorOrAdmin && (
              <div className="panel" style={{ padding: "24px" }}>
                <h3 className="section-title" style={{ marginBottom: "16px" }}>Simulate Route Update</h3>
                {simMessage && (
                  <div className={`alert ${simMessage.startsWith("Error") ? "danger" : "success"}`} style={{ marginBottom: "16px" }}>
                    {simMessage}
                  </div>
                )}
                <form onSubmit={handleSimulateUpdate} className="form-grid" style={{ margin: 0 }}>
                  <div className="form-field full" style={{ margin: 0 }}>
                    <label htmlFor="sim-city">Location Name (e.g. Chennai, Vellore, Krishnagiri, Bengaluru)</label>
                    <input
                      id="sim-city"
                      type="text"
                      className="input"
                      placeholder="Enter city or place name"
                      value={simLocation}
                      onChange={(e) => setSimLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field full" style={{ margin: "12px 0 0 0" }}>
                    <label htmlFor="sim-status">Status</label>
                    <select
                      id="sim-status"
                      className="select"
                      value={simStatus}
                      onChange={(e) => setSimStatus(e.target.value)}
                    >
                      <option value="In Transit">In Transit</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="button primary"
                    disabled={simLoading}
                    style={{ marginTop: "18px", width: "100%" }}
                  >
                    {simLoading ? "Saving..." : "Post Location Update"}
                  </button>
                </form>
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <RouteStatistics history={filteredHistory} shipment={shipment} />
            <RouteHistoryMap history={filteredHistory} shipment={shipment} />
            <LocationList history={filteredHistory} shipmentId={shipmentId} />
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteHistoryPage;
