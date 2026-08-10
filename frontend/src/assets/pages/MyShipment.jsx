import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/auth";
import { ShipmentContext } from "../context/shipments";
import "./CustomerDashboard.css";

/**
 * My Shipments — Customer-facing page.
 *
 * Shows ONLY shipments belonging to the currently authenticated customer.
 * Ownership is enforced server-side: GET /api/shipments returns only the
 * customer's own records when the caller has role CUSTOMER.
 *
 * This page deliberately excludes all Admin / Logistics Operator controls:
 * - No "Assign Driver" or "Assign Vehicle"
 * - No status-update dropdown
 * - No approval/rejection workflow
 */

const STATUS_FILTERS = [
  "All",
  "Created",
  "Picked Up",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Failed Delivery",
  "Returned",
];

function badgeClass(status) {
  return `cdb-badge ${String(status).toLowerCase().replace(/\s+/g, "-")}`;
}

function ProgressBar({ value }) {
  return (
    <div className="cdb-progress-track" style={{ minWidth: 80 }}>
      <div
        className="cdb-progress-fill"
        style={{ width: `${Number(value || 0)}%` }}
      />
      <div style={{ fontSize: 11, color: "#6b7f99", marginTop: 3 }}>
        {value}%
      </div>
    </div>
  );
}

function MyShipment() {
  const { auth } = useContext(AuthContext);
  const { shipments, loading, error } = useContext(ShipmentContext);

  const firstName   = auth?.user?.firstName;
  const fullName    = auth?.user?.name || (firstName
    ? `${firstName} ${auth?.user?.lastName || ""}`.trim()
    : null);
  const displayName = fullName || auth?.user?.email || "Customer";

  const [query,  setQuery]  = useState("");
  const [status, setStatus] = useState("All");

  // ShipmentContext already contains only this customer's shipments
  // (backend enforces CUSTOMER role → userId filter)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter((s) => {
      const matchStatus = status === "All" || s.status === status;
      if (!matchStatus) return false;
      if (!q) return true;
      const haystack = [
        s.trackingNumber,
        s.senderName,
        s.receiverName,
        s.senderCity,
        s.receiverCity,
        s.status,
        s.packageType,
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [shipments, query, status]);

  const hasShipments = shipments.length > 0;

  return (
    <div className="page">
      {/* ---- Page Header ---- */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="eyebrow">Customer Portal</div>
          <h1 style={{ margin: "4px 0 6px" }}>My Shipments</h1>
          <p className="subtle">
            All shipments associated with your account, {displayName}.
          </p>
        </div>
        <Link className="button primary" to="/shipments/new">
          + Create Shipment
        </Link>
      </div>

      {/* ---- Error / Loading ---- */}
      {error   && <div className="cdb-error" style={{ marginBottom: 18 }}>{error}</div>}
      {loading && (
        <div className="cdb-loading" style={{ marginBottom: 18 }}>
          Loading your shipments…
        </div>
      )}

      {/* ---- Empty State (no shipments at all) ---- */}
      {!loading && !error && !hasShipments && (
        <div className="cdb-panel">
          <div className="cdb-empty">
            <div className="cdb-empty-icon">📭</div>
            <h3>No shipments yet</h3>
            <p>Create your first shipment to start tracking your delivery.</p>
            <Link to="/shipments/new">Create Shipment</Link>
          </div>
        </div>
      )}

      {/* ---- Filters + Table ---- */}
      {!loading && !error && hasShipments && (
        <div className="cdb-panel">
          {/* Search + Status filter */}
          <div
            className="toolbar"
            style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}
          >
            <input
              className="input"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tracking, sender, receiver, city…"
              style={{ minWidth: 280, flex: 1 }}
              type="text"
              value={query}
            />
            <select
              className="select"
              onChange={(e) => setStatus(e.target.value)}
              value={status}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="subtle" style={{ alignSelf: "center", fontSize: 13 }}>
              {filtered.length} shipment{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* No results after filter */}
          {filtered.length === 0 && (
            <div className="cdb-empty" style={{ padding: "32px 0" }}>
              <div className="cdb-empty-icon">🔍</div>
              <h3>No shipments match your search</h3>
              <p>Try adjusting your search or filter.</p>
            </div>
          )}

          {/* Shipments table */}
          {filtered.length > 0 && (
            <div className="cdb-table-wrap">
              <table className="cdb-table">
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Origin</th>
                    <th>Destination</th>
                    <th>Type</th>
                    <th>Weight</th>
                    <th>Status</th>
                    <th>ETA</th>
                    <th>Progress</th>
                    <th>Last Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      {/* Tracking number */}
                      <td>
                        <strong style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                          {s.trackingNumber}
                        </strong>
                      </td>

                      {/* Sender */}
                      <td>{s.senderName || "—"}</td>

                      {/* Receiver */}
                      <td>{s.receiverName || "—"}</td>

                      {/* Origin */}
                      <td>{s.senderCity || "—"}</td>

                      {/* Destination */}
                      <td>{s.receiverCity || "—"}</td>

                      {/* Shipment type */}
                      <td>
                        <span style={{ fontSize: "0.8rem", color: "#4b5f78" }}>
                          {s.shipmentType || s.packageType || "Standard"}
                        </span>
                      </td>

                      {/* Weight */}
                      <td>
                        {s.weight ||
                          (s.totalWeightKg != null ? `${s.totalWeightKg} kg` : "—")}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={badgeClass(s.status)}>{s.status}</span>
                      </td>

                      {/* ETA */}
                      <td style={{ whiteSpace: "nowrap" }}>{s.eta || "—"}</td>

                      {/* Progress */}
                      <td>
                        <ProgressBar value={s.progress ?? 0} />
                      </td>

                      {/* Last updated */}
                      <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem", color: "#6b7f99" }}>
                        {s.updatedAt
                          ? new Date(s.updatedAt).toLocaleDateString("en-IN")
                          : s.createdAt
                          ? new Date(s.createdAt).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      {/* Action — Track button only (no admin controls) */}
                      <td>
                        <Link
                          className="button secondary compact"
                          to={`/track?tracking=${encodeURIComponent(s.trackingNumber)}`}
                        >
                          Track
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MyShipment;
