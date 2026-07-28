import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/auth";
import { ShipmentContext } from "../context/shipments";

const roleLabels = {
  BUSINESS_CLIENT: "Business Client",
  LOGISTICS_OPERATOR: "Logistics Operator",
  ADMINISTRATOR: "Administrator",
};

const normalizeRole = (role) => roleLabels[role] || role || "Customer";
const editableRoles = ["Business Client", "Logistics Operator", "Administrator"];
const shipmentAdminRoles = ["Administrator"];
const shipmentManagerRoles = ["Administrator", "Logistics Operator"];

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

const VALID_NEXT_STATUSES = {
  "Created":          ["Picked Up", "Cancelled"],
  "Picked Up":        ["In Transit", "Cancelled"],
  "In Transit":       ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered", "Failed Delivery", "Cancelled"],
  "Failed Delivery":  ["Out for Delivery", "Returned", "Cancelled"],
  "Delivered":        [],
  "Cancelled":        [],
  "Returned":         [],
};

function ShipmentAdminWorkspace({ shipment, statuses, updateShipment, updateStatus, cancelShipment, rejectShipment, close }) {
  const [details, setDetails] = useState(() => ({
    senderName: shipment.senderName,
    senderCity: shipment.senderCity,
    receiverName: shipment.receiverName,
    receiverCity: shipment.receiverCity,
    packageType: shipment.packageType,
    weight: shipment.weight,
    priority: shipment.priority,
    eta: shipment.eta,
    deliveryAddress: shipment.deliveryAddress,
  }));
  const [nextStatus, setNextStatus] = useState(shipment.status);
  const [location, setLocation] = useState("");
  const [notice, setNotice] = useState("");
  const isCancelled = shipment.status === "Cancelled";
  const isDelivered = shipment.status === "Delivered";
  const isPendingApproval = shipment.status === "Pending Approval";

  const saveDetails = async (event) => {
    event.preventDefault();
    try {
      await updateShipment(shipment.trackingNumber, details);
      setNotice("Shipment information and package details updated.");
    } catch (error) {
      setNotice(error?.response?.data?.message || "Could not save shipment details.");
    }
  };

  const saveStatus = async (event) => {
    event.preventDefault();
    if (nextStatus === shipment.status) return;
    try {
      await updateStatus(shipment.trackingNumber, nextStatus, location);
      setNotice(`Status updated to ${nextStatus}. A tracking event was added.`);
    } catch (error) {
      setNotice(error?.response?.data?.message || "Could not update shipment status.");
    }
  };

  const cancel = async () => {
    if (!window.confirm(`Cancel shipment ${shipment.trackingNumber}? This action is recorded in its history.`)) {
      return;
    }
    try {
      await cancelShipment(shipment.trackingNumber, location);
      setNotice("Shipment cancelled and retained in tracking history.");
    } catch (error) {
      setNotice(error?.response?.data?.message || "Could not cancel shipment.");
    }
  };

  const approveRequest = async () => {
    try { await updateStatus(shipment.trackingNumber, "Created", location || shipment.senderCity); }
    catch (error) { setNotice(error.message || "Unable to approve shipment."); return; }
    setNotice("Shipment request approved. The shipment is ready for lifecycle updates.");
  };

  const rejectRequest = async () => {
    if (!window.confirm(`Reject shipment request ${shipment.trackingNumber}?`)) return;
    try { await rejectShipment(shipment.trackingNumber, location || shipment.senderCity); }
    catch (error) { setNotice(error.message || "Unable to reject shipment."); return; }
    setNotice("Shipment request rejected and retained in the request history.");
  };

  return (
    <section className="panel admin-workspace" aria-label={`Manage ${shipment.trackingNumber}`}>
      <div className="toolbar">
        <div>
          <div className="eyebrow">Administrative shipment workspace</div>
          <h2 className="section-title" style={{ marginTop: 6 }}>
            {shipment.trackingNumber}
          </h2>
        </div>
        <div className="row-actions">
          <span className={`badge ${statusClass(shipment.status)}`}>{shipment.status}</span>
          <button className="button secondary compact" onClick={close} type="button">Close</button>
        </div>
      </div>

      {notice && <div className="alert success" style={{ marginBottom: 18 }}>{notice}</div>}

      <div className="grid grid-2">
        <form onSubmit={saveDetails}>
          <h3 className="section-title">Shipment information</h3>
          <div className="form-grid">
            <div className="form-field">
              <label>Tracking number</label>
              <input className="input" disabled value={shipment.trackingNumber} />
            </div>
            <div className="form-field">
              <label htmlFor="eta">Estimated delivery</label>
              <input className="input" id="eta" name="eta" onChange={(e) => setDetails((value) => ({ ...value, eta: e.target.value }))} type="date" value={details.eta} />
            </div>
            <div className="form-field">
              <label htmlFor="senderName">Sender details</label>
              <input className="input" id="senderName" onChange={(e) => setDetails((value) => ({ ...value, senderName: e.target.value }))} required value={details.senderName} />
            </div>
            <div className="form-field">
              <label htmlFor="senderCity">Sender city</label>
              <input className="input" id="senderCity" onChange={(e) => setDetails((value) => ({ ...value, senderCity: e.target.value }))} required value={details.senderCity} />
            </div>
            <div className="form-field">
              <label htmlFor="receiverName">Receiver details</label>
              <input className="input" id="receiverName" onChange={(e) => setDetails((value) => ({ ...value, receiverName: e.target.value }))} required value={details.receiverName} />
            </div>
            <div className="form-field">
              <label htmlFor="receiverCity">Receiver city</label>
              <input className="input" id="receiverCity" onChange={(e) => setDetails((value) => ({ ...value, receiverCity: e.target.value }))} required value={details.receiverCity} />
            </div>
            <div className="form-field">
              <label htmlFor="packageType">Package type</label>
              <input className="input" id="packageType" onChange={(e) => setDetails((value) => ({ ...value, packageType: e.target.value }))} required value={details.packageType} />
            </div>
            <div className="form-field">
              <label htmlFor="weight">Package weight</label>
              <input className="input" id="weight" onChange={(e) => setDetails((value) => ({ ...value, weight: e.target.value }))} required value={details.weight} />
            </div>
            <div className="form-field">
              <label htmlFor="priority">Priority</label>
              <select className="select" id="priority" onChange={(e) => setDetails((value) => ({ ...value, priority: e.target.value }))} value={details.priority}>
                <option>Standard</option><option>Express</option><option>Critical</option>
              </select>
            </div>
            <div className="form-field full">
              <label htmlFor="deliveryAddress">Delivery address</label>
              <textarea className="textarea" id="deliveryAddress" onChange={(e) => setDetails((value) => ({ ...value, deliveryAddress: e.target.value }))} required value={details.deliveryAddress} />
            </div>
          </div>
          <button className="button primary" style={{ marginTop: 18 }} type="submit">Save shipment details</button>
        </form>

        <div>
          <form className="lifecycle-form" onSubmit={saveStatus}>
            <h3 className="section-title">{isPendingApproval ? "Pending shipment request" : "Lifecycle management"}</h3>
            <div className="form-field">
              <label htmlFor="status">Shipment status</label>
              <select className="select" disabled={isCancelled || isDelivered || isPendingApproval} id="status" onChange={(e) => setNextStatus(e.target.value)} value={nextStatus}>
                {[shipment.status, ...(VALID_NEXT_STATUSES[shipment.status] || [])].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ marginTop: 14 }}>
              <label htmlFor="location">Current location</label>
              <input className="input" disabled={isCancelled || isDelivered} id="location" onChange={(e) => setLocation(e.target.value)} placeholder="Enter the current checkpoint city" required value={location} />
            </div>
            {isPendingApproval ? <><button className="button primary" onClick={approveRequest} style={{ marginTop: 18 }} type="button">Approve request</button><button className="button danger" onClick={rejectRequest} style={{ marginLeft: 10, marginTop: 18 }} type="button">Reject request</button></> : <><button className="button primary" disabled={isCancelled || isDelivered || nextStatus === shipment.status} style={{ marginTop: 18 }} type="submit">Post tracking update</button><button className="button danger" disabled={isCancelled || isDelivered} onClick={cancel} style={{ marginLeft: 10, marginTop: 18 }} type="button">Cancel shipment</button></>}
          </form>

          <div className="history-panel">
            <h3 className="section-title">Shipment history</h3>
            <ul className="timeline compact-timeline">
              {[...shipment.history].reverse().map((event) => (
                <li className="timeline-item" key={`${event.status}-${event.timestamp}`}>
                  <div className="timeline-dot" />
                  <div><div className="timeline-title">{event.status}</div><div className="timeline-meta">{event.location}</div><div className="timeline-meta">{formatDateTime(event.timestamp)}</div></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShipmentList() {
  const { auth } = useContext(AuthContext);
  const { shipments, statuses, updateStatus, updateShipment, cancelShipment, rejectShipment, metrics, loading, error } = useContext(ShipmentContext);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedTracking, setSelectedTracking] = useState(null);
  const role = normalizeRole(auth.user.role);
  const canEditStatus = editableRoles.includes(role);
  const isShipmentAdmin = shipmentAdminRoles.includes(role);
  const canManageShipments = shipmentManagerRoles.includes(role);
  const selectedShipment = shipments.find((shipment) => shipment.trackingNumber === selectedTracking);
  const pendingRequests = useMemo(
    () => shipments.filter((shipment) => shipment.status === "Pending Approval"),
    [shipments],
  );

  const filteredShipments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return shipments.filter((shipment) => {
      const matchesStatus = status === "All" || shipment.status === status;
      const searchable = [shipment.trackingNumber, shipment.senderName, shipment.receiverName, shipment.senderCity, shipment.receiverCity].join(" ").toLowerCase();
      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [query, shipments, status]);

  const approveRequest = (shipment) => {
    updateStatus(shipment.trackingNumber, "Created", shipment.senderCity);
  };

  const rejectRequest = (shipment) => {
    if (!window.confirm(`Reject shipment request ${shipment.trackingNumber}?`)) return;
    rejectShipment(shipment.trackingNumber, shipment.senderCity);
  };

  return (
    <div className="page">
      <div className="page-header"><div><div className="eyebrow">Shipment management</div><h1>{canManageShipments ? "Shipment operations" : "Management dashboard"}</h1><p className="subtle">Review shipment information, manage lifecycle updates, and keep a complete tracking history.</p></div><Link className="button primary" to="/shipments/new">+ New shipment</Link></div>

      {error && <div className="alert error" style={{ marginBottom: 18 }}>{error}</div>}
      {loading && <div className="alert" style={{ marginBottom: 18 }}>Loading shipments…</div>}

      <section className="grid grid-4" style={{ marginBottom: 18 }}>
        <div className="metric-card"><div className="metric-label">Total</div><div className="metric-value">{metrics.total}</div></div>
        <div className="metric-card"><div className="metric-label">Active</div><div className="metric-value">{metrics.active}</div></div>
        <div className="metric-card"><div className="metric-label">Delivered</div><div className="metric-value">{metrics.delivered}</div></div>
        <div className="metric-card"><div className="metric-label">{isShipmentAdmin ? "Pending requests" : "Delayed or failed"}</div><div className="metric-value">{isShipmentAdmin ? metrics.pendingApproval : metrics.delayed}</div></div>
      </section>

      {isShipmentAdmin && (
        <section className="panel requested-shipments">
          <div className="toolbar requested-shipments-heading">
            <div>
              <div className="eyebrow">Approval queue</div>
              <h2 className="section-title" style={{ marginTop: 6 }}>Requested shipments</h2>
              <p className="subtle">Review sender, receiver, package, and delivery details before approving a request.</p>
            </div>
            <span className="badge pending-approval">{pendingRequests.length} pending</span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="requested-empty">There are no shipment requests waiting for approval.</div>
          ) : (
            <div className="requested-shipment-grid">
              {pendingRequests.map((shipment) => (
                <article className="shipment-request" key={shipment.id}>
                  <div className="shipment-request-header">
                    <div>
                      <div className="eyebrow">{shipment.trackingNumber}</div>
                      <strong>{shipment.packageType}</strong>
                    </div>
                    <span className="badge pending-approval">Pending approval</span>
                  </div>
                  <div className="shipment-request-route">
                    <div><span>Sender</span><strong>{shipment.senderName}</strong><small>{shipment.senderCity}</small></div>
                    <div><span>Receiver</span><strong>{shipment.receiverName}</strong><small>{shipment.receiverCity}</small></div>
                  </div>
                  <div className="shipment-request-meta">
                    <span>{shipment.weight}</span><span>{shipment.priority}</span><span>ETA {shipment.eta}</span>
                  </div>
                  <div className="row-actions shipment-request-actions">
                    <button className="button primary compact" onClick={() => approveRequest(shipment)} type="button">Approve</button>
                    <button className="button danger compact" onClick={() => rejectRequest(shipment)} type="button">Reject</button>
                    <button className="button secondary compact" onClick={() => setSelectedTracking(shipment.trackingNumber)} type="button">Review details</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {canManageShipments && selectedShipment && <ShipmentAdminWorkspace cancelShipment={cancelShipment} close={() => setSelectedTracking(null)} key={`${selectedShipment.trackingNumber}-${selectedShipment.status}`} rejectShipment={rejectShipment} shipment={selectedShipment} statuses={statuses} updateShipment={updateShipment} updateStatus={updateStatus} />}

      <section className="panel">
        <div className="toolbar"><div className="filters"><input className="input" onChange={(e) => setQuery(e.target.value)} placeholder="Search tracking, sender, receiver, city" style={{ minWidth: 300 }} value={query} /><select className="select" onChange={(e) => setStatus(e.target.value)} value={status}><option>All</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></div><span className="subtle">{filteredShipments.length} visible records</span></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Tracking</th><th>Route</th><th>Package</th><th>Status</th><th>Progress</th><th>ETA</th><th>Action</th></tr></thead><tbody>{filteredShipments.map((shipment) => <tr key={shipment.id}><td><strong>{shipment.trackingNumber}</strong><div className="subtle" style={{ fontSize: 12 }}>{shipment.id}</div></td><td><strong>{shipment.senderCity}</strong> to <strong>{shipment.receiverCity}</strong><div className="subtle" style={{ fontSize: 12 }}>{shipment.receiverName}</div></td><td>{shipment.packageType}<div className="subtle" style={{ fontSize: 12 }}>{shipment.weight} - {shipment.priority}</div></td><td><span className={`badge ${statusClass(shipment.status)}`}>{shipment.status}</span></td><td style={{ minWidth: 150 }}><div className="progress-track"><div className="progress-fill" style={{ width: `${shipment.progress}%` }} /></div><div className="subtle" style={{ fontSize: 12, marginTop: 4 }}>{shipment.progress}% complete</div></td><td>{shipment.eta}</td><td>{canManageShipments ? <button className="button secondary compact" onClick={() => setSelectedTracking(shipment.trackingNumber)} type="button">Manage</button> : canEditStatus ? <select className="select" onChange={(e) => updateStatus(shipment.trackingNumber, e.target.value, shipment.receiverCity)} value={shipment.status}>{statuses.map((item) => <option key={item}>{item}</option>)}</select> : <Link className="button secondary" to="/track">Track</Link>}</td></tr>)}</tbody></table></div>
        {filteredShipments.length === 0 && <div className="empty-state">No shipments match the selected filters.</div>}
      </section>
    </div>
  );
}

export default ShipmentList;
