import { useState } from "react";

/**
 * Component for searching a shipment by ID or tracking number.
 */
function SearchShipmentId({ onSearch, isLoading }) {
  const [shipmentId, setShipmentId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (shipmentId.trim()) {
      onSearch(shipmentId.trim());
    }
  };

  return (
    <div className="panel" style={{ padding: "20px", marginBottom: "20px" }}>
      <form onSubmit={handleSubmit} className="filters" style={{ display: "flex", gap: "12px", alignItems: "flex-end", margin: 0 }}>
        <div className="form-field" style={{ flex: 1, margin: 0 }}>
          <label htmlFor="shipment-search-id" style={{ display: "block", marginBottom: "6px", fontWeight: "bold", color: "#475569" }}>
            Shipment ID / Tracking Number
          </label>
          <input
            id="shipment-search-id"
            type="text"
            className="input"
            placeholder="Enter Shipment ID (e.g., SHP001)"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
            required
          />
        </div>
        <button
          type="submit"
          className="button primary"
          disabled={isLoading}
          style={{ height: "42px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "120px" }}
        >
          {isLoading ? "Searching..." : "Track Route"}
        </button>
      </form>
    </div>
  );
}

export default SearchShipmentId;
