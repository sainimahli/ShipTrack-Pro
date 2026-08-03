import { useMemo } from "react";

function formatDateTime(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(value));
  } catch (e) {
    return value;
  }
}

function statusClass(status) {
  if (!status) return "";
  return status.toLowerCase().replaceAll(" ", "-");
}

/**
 * Visual timeline displaying route locations, times, status and connectors.
 */
function RouteHistoryTimeline({ history = [], shipment }) {
  const displayHistory = useMemo(() => {
    if (history && history.length > 0) {
      return history;
    }
    if (shipment) {
      const isDelivered = shipment.status === "Delivered";
      const originDate = shipment.createdAt || new Date().toISOString();
      const destDate = shipment.eta || "";
      return [
        {
          locationName: shipment.senderCity,
          timestamp: originDate,
          status: "Created",
          id: "origin-placeholder"
        },
        {
          locationName: shipment.receiverCity,
          timestamp: destDate,
          status: isDelivered ? "Delivered" : "Awaiting Transit",
          id: "destination-placeholder"
        }
      ];
    }
    return [];
  }, [history, shipment]);

  if (!displayHistory || displayHistory.length === 0) {
    return (
      <div className="panel" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
        No route history records found for this shipment.
      </div>
    );
  }

  return (
    <div className="panel" style={{ padding: "24px" }}>
      <h3 className="section-title" style={{ marginBottom: "20px" }}>Route Timeline</h3>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "400px", margin: "0 auto" }}>
        {displayHistory.map((point, index) => {
          const isFallback = !history || history.length === 0;
          const isLatest = isFallback ? (index === 0) : (index === displayHistory.length - 1);
          const isCompleted = !isLatest && (isFallback ? false : index < displayHistory.length - 1);
          const isLast = index === displayHistory.length - 1;
          const displayStatus = point.status || "In Transit";

          return (
            <div key={point.id || index} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <div 
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  padding: "16px", 
                  background: isLatest ? "#eff6ff" : (isCompleted ? "#f0fdf4" : "#f8fafc"), 
                  border: isLatest ? "2px solid #2563eb" : (isCompleted ? "1px solid #10b981" : "1px solid #e2e8f0"), 
                  borderRadius: "12px", 
                  width: "100%", 
                  boxShadow: isLatest ? "0 4px 12px rgba(37, 99, 235, 0.15)" : "0 1px 3px rgba(0,0,0,0.05)",
                  cursor: "default",
                  position: "relative"
                }}
              >
                {isLatest && (
                  <span style={{ 
                    fontSize: "10px", 
                    color: "#2563eb", 
                    fontWeight: "bold", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em",
                    marginBottom: "6px",
                    background: "#dbeafe",
                    padding: "2px 8px",
                    borderRadius: "20px"
                  }}>
                    Latest Checkpoint
                  </span>
                )}

                {isCompleted && (
                  <span style={{ 
                    fontSize: "10px", 
                    color: "#15803d", 
                    fontWeight: "bold", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em",
                    marginBottom: "6px",
                    background: "#dcfce7",
                    padding: "2px 8px",
                    borderRadius: "20px"
                  }}>
                    ✓ Visited Checkpoint
                  </span>
                )}
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", justifyContent: "center" }}>
                  <span style={{ fontSize: "20px" }}>{isLatest ? "📍" : (isCompleted ? "🟢" : "⚪")}</span>
                  <strong style={{ fontSize: "16px", color: "#0f172a" }}>{point.locationName}</strong>
                </div>
                
                <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>
                    {formatDateTime(point.timestamp)}
                  </span>
                  <span className={`badge ${statusClass(displayStatus)}`} style={{ fontSize: "11px", padding: "2px 8px" }}>
                    {displayStatus}
                  </span>
                </div>
              </div>

              {!isLast && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "12px 0" }}>
                  <span style={{ fontSize: "24px", color: isCompleted || isLatest ? "#10b981" : "#e2e8f0", fontWeight: "bold", lineHeight: "1" }}>↓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RouteHistoryTimeline;
