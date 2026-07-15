import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/auth";
import { ShipmentContext } from "../context/shipments";

const roleLabels = {
  BUSINESS_CLIENT: "Business Client",
  LOGISTICS_OPERATOR: "Logistics Operator",
  ADMINISTRATOR: "Administrator",
  SUPER_ADMIN: "Super Admin",
};

const normalizeRole = (role) => roleLabels[role] || role || "Customer";

const editableRoles = ["Business Client", "Logistics Operator", "Administrator", "Super Admin"];
const shipmentAdminRoles = ["Administrator", "Super Admin"];

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function ShipmentList() {
  const { auth } = useContext(AuthContext);
  const { shipments, statuses, updateStatus, metrics } = useContext(ShipmentContext);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const role = normalizeRole(auth.user.role);
  const canEditStatus = editableRoles.includes(role);
  const canViewAdminShipmentContent = shipmentAdminRoles.includes(role);

  const filteredShipments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return shipments.filter((shipment) => {
      const matchesStatus = status === "All" || shipment.status === status;
      const searchable = [
        shipment.trackingNumber,
        shipment.senderName,
        shipment.receiverName,
        shipment.senderCity,
        shipment.receiverCity,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [query, shipments, status]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Shipment management</div>
          <h1>Management dashboard</h1>
          <p className="subtle">Filter shipments, review route progress, and update lifecycle status.</p>
        </div>
        <Link className="button primary" to="/shipments/new">
          {role === "Customer" ? "+ Request shipment" : "+ New shipment"}
        </Link>
      </div>

      <section className="grid grid-4" style={{ marginBottom: 18 }}>
        <div className="metric-card">
          <div className="metric-label">Total</div>
          <div className="metric-value">{metrics.total}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active</div>
          <div className="metric-value">{metrics.active}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Delivered</div>
          <div className="metric-value">{metrics.delivered}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Delayed or failed</div>
          <div className="metric-value">{metrics.delayed}</div>
        </div>
      </section>

      {/* {canViewAdminShipmentContent && <AdminShipmentContent />} */}

      <section className="panel">
        <div className="toolbar">
          <div className="filters">
            <input
              className="input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tracking, sender, receiver, city"
              style={{ minWidth: 300 }}
              value={query}
            />
            <select className="select" onChange={(event) => setStatus(event.target.value)} value={status}>
              <option>All</option>
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <span className="subtle">{filteredShipments.length} visible records</span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Route</th>
                <th>Package</th>
                <th>Status</th>
                <th>Progress</th>
                <th>ETA</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment) => (
                <tr key={shipment.id}>
                  <td>
                    <strong>{shipment.trackingNumber}</strong>
                    <div className="subtle" style={{ fontSize: 12 }}>
                      {shipment.id}
                    </div>
                  </td>
                  <td>
                    <strong>{shipment.senderCity}</strong> to <strong>{shipment.receiverCity}</strong>
                    <div className="subtle" style={{ fontSize: 12 }}>
                      {shipment.receiverName}
                    </div>
                  </td>
                  <td>
                    {shipment.packageType}
                    <div className="subtle" style={{ fontSize: 12 }}>
                      {shipment.weight} - {shipment.priority}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${statusClass(shipment.status)}`}>{shipment.status}</span>
                  </td>
                  <td style={{ minWidth: 150 }}>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${shipment.progress}%` }} />
                    </div>
                    <div className="subtle" style={{ fontSize: 12, marginTop: 4 }}>
                      {shipment.progress}% complete
                    </div>
                  </td>
                  <td>{shipment.eta}</td>
                  <td>
                    {canEditStatus ? (
                      <select
                        className="select"
                        onChange={(event) =>
                          updateStatus(shipment.trackingNumber, event.target.value, shipment.receiverCity)
                        }
                        value={shipment.status}
                      >
                        {statuses.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    ) : (
                      <Link className="button secondary" to="/track">
                        Track
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredShipments.length === 0 && (
          <div className="empty-state">No shipments match the selected filters.</div>
        )}
      </section>
    </div>
  );
}

export default ShipmentList;
