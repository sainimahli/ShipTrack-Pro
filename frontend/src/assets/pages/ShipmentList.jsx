import { useContext, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth";
import { ShipmentContext } from "../context/shipments";
import {
  sendDeliveryOtp,
  verifyDeliveryOtp
} from "../services/api";
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
  return String(status).toLowerCase().replaceAll(" ", "-");
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-IN");
}

const VALID_NEXT_STATUSES = {
  Created: ["Picked Up", "Cancelled"],
  "Picked Up": ["In Transit", "Cancelled"],
  "In Transit": ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered", "Failed Delivery", "Cancelled"],
  "Failed Delivery": ["Out for Delivery", "Returned", "Cancelled"],
  Delivered: [],
  Cancelled: [],
  Returned: [],
};

function ShipmentAdminWorkspace({
                                  shipment,
                                  updateShipment,
                                  updateStatus,
                                  cancelShipment,
                                  rejectShipment,
                                  close,
                                  refetch,
                                }) {
  console.log("ADMIN WORKSPACE OPENED:", shipment);
  console.log("RETURNING WORKSPACE UI");
  const [details, setDetails] = useState(() => ({
    senderName: shipment.senderName || "",
    senderCity: shipment.senderCity || "",
    receiverName: shipment.receiverName || "",
    receiverCity: shipment.receiverCity || "",
    packageType: shipment.packageType || "",
    weight: shipment.weight || "",
    priority: shipment.priority || "Standard",
    eta: shipment.eta || "",
    deliveryAddress: shipment.deliveryAddress || "",
  }));

  const [nextStatus, setNextStatus] = useState(shipment.status);
  const [location, setLocation] = useState("");
  const [notice, setNotice] = useState("");

  const [receiverName, setReceiverName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showDeliveryPopup, setShowDeliveryPopup] = useState(false);

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
    if (!window.confirm(`Cancel shipment ${shipment.trackingNumber}?`)) return;

    try {
      await cancelShipment(shipment.trackingNumber, location);
      setNotice("Shipment cancelled and retained in tracking history.");
    } catch (error) {
      setNotice(error?.response?.data?.message || "Could not cancel shipment.");
    }
  };

  const approveRequest = async () => {
    try {
      await updateStatus(shipment.trackingNumber, "Created", location || shipment.senderCity);
      setNotice("Shipment request approved.");
    } catch (error) {
      setNotice(error.message || "Unable to approve shipment.");
    }
  };

  const rejectRequest = async () => {
    if (!window.confirm(`Reject shipment request ${shipment.trackingNumber}?`)) return;

    try {
      await rejectShipment(shipment.trackingNumber, location || shipment.senderCity);
      setNotice("Shipment request rejected.");
    } catch (error) {
      setNotice(error.message || "Unable to reject shipment.");
    }
  };
  const handleSendOtp = async () => {
    try {

      await sendDeliveryOtp(
          shipment.shipmentId
      );

      setOtpSent(true);
      setNotice("OTP sent to customer.");

    } catch(error) {

      setNotice(
          error?.response?.data?.message ||
          "Failed to send OTP"
      );

    }
  };


  const handleVerifyOtp = async () => {
    try {

      await verifyDeliveryOtp(
          shipment.shipmentId,
          {
            otp,
            receiverName,
            remarks,
          }
      );

      setNotice("Delivery confirmed successfully.");
      await refetch();

      setOtp("");
      setOtpSent(false);
      setShowDeliveryPopup(false);

    } catch(error) {

      setNotice(
          error?.response?.data?.message ||
          "Invalid OTP"
      );

    }
  };

  return (
      <>


      <section className="panel admin-workspace">
        <div className="toolbar">
          <div>
            <div className="eyebrow">Administrative shipment workspace</div>
            <h2 className="section-title" style={{ marginTop: 6 }}>
              {shipment.trackingNumber}
            </h2>
          </div>
          <div className="row-actions">


  <span className={`badge ${statusClass(shipment.status)}`}>
    {shipment.status}
  </span>

            <button
                className="button primary compact"
                type="button"
                onClick={() => setShowDeliveryPopup(true)}
            >
              Confirm Delivery
            </button>


            <button
                className="button secondary compact"
                onClick={close}
                type="button"
            >
              Close
            </button>

          </div>
        </div>



        {notice && (
            <div className="alert success" style={{ marginBottom: 18 }}>
              {notice}
            </div>
        )}

        <div className="grid grid-2">
          <form onSubmit={saveDetails}>
            <h3 className="section-title">Shipment information</h3>

            <div className="form-grid">
              <div className="form-field">
                <label>Tracking number</label>
                <input className="input" disabled value={shipment.trackingNumber || ""} />
              </div>

              <div className="form-field">
                <label htmlFor="eta">Estimated delivery</label>
                <input
                    className="input"
                    id="eta"
                    type="date"
                    value={details.eta}
                    onChange={(e) => setDetails((value) => ({ ...value, eta: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label htmlFor="senderName">Sender details</label>
                <input
                    className="input"
                    id="senderName"
                    required
                    value={details.senderName}
                    onChange={(e) => setDetails((value) => ({ ...value, senderName: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label htmlFor="senderCity">Sender city</label>
                <input
                    className="input"
                    id="senderCity"
                    required
                    value={details.senderCity}
                    onChange={(e) => setDetails((value) => ({ ...value, senderCity: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label htmlFor="receiverName">Receiver details</label>
                <input
                    className="input"
                    id="receiverName"
                    required
                    value={details.receiverName}
                    onChange={(e) => setDetails((value) => ({ ...value, receiverName: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label htmlFor="receiverCity">Receiver city</label>
                <input
                    className="input"
                    id="receiverCity"
                    required
                    value={details.receiverCity}
                    onChange={(e) => setDetails((value) => ({ ...value, receiverCity: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label htmlFor="packageType">Package type</label>
                <input
                    className="input"
                    id="packageType"
                    required
                    value={details.packageType}
                    onChange={(e) => setDetails((value) => ({ ...value, packageType: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label htmlFor="weight">Package weight</label>
                <input
                    className="input"
                    id="weight"
                    required
                    value={details.weight}
                    onChange={(e) => setDetails((value) => ({ ...value, weight: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label htmlFor="priority">Priority</label>
                <select
                    className="select"
                    id="priority"
                    value={details.priority}
                    onChange={(e) => setDetails((value) => ({ ...value, priority: e.target.value }))}
                >
                  <option>Standard</option>
                  <option>Express</option>
                  <option>Critical</option>
                </select>
              </div>

              <div className="form-field full">
                <label htmlFor="deliveryAddress">Delivery address</label>
                <textarea
                    className="textarea"
                    id="deliveryAddress"
                    required
                    value={details.deliveryAddress}
                    onChange={(e) =>
                        setDetails((value) => ({ ...value, deliveryAddress: e.target.value }))
                    }
                />
              </div>
            </div>

            <button className="button primary" style={{ marginTop: 18 }} type="submit">
              Save shipment details
            </button>
          </form>

          <div>
            <form className="lifecycle-form" onSubmit={saveStatus}>
              <h3 className="section-title">
                {isPendingApproval ? "Pending shipment request" : "Lifecycle management"}
              </h3>

              <div className="form-field">
                <label htmlFor="status">Shipment status</label>
                <select
                    className="select"
                    disabled={isCancelled || isDelivered || isPendingApproval}
                    id="status"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                >
                  {[shipment.status, ...(VALID_NEXT_STATUSES[shipment.status] || [])].map((item) => (
                      <option key={String(item)} value={String(item)}>
                        {String(item)}
                      </option>
                  ))}
                </select>
              </div>

              <div className="form-field" style={{ marginTop: 14 }}>
                <label htmlFor="location">Current location</label>
                <input
                    className="input"
                    disabled={isCancelled || isDelivered}
                    id="location"
                    placeholder="Enter the current checkpoint city"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {isPendingApproval ? (
                  <>
                    <button className="button primary" onClick={approveRequest} style={{ marginTop: 18 }} type="button">
                      Approve request
                    </button>
                    <button className="button danger" onClick={rejectRequest} style={{ marginLeft: 10, marginTop: 18 }} type="button">
                      Reject request
                    </button>
                  </>
              ) : (
                  <>
                    <button
                        className="button primary"
                        disabled={isCancelled || isDelivered || nextStatus === shipment.status}
                        style={{ marginTop: 18 }}
                        type="submit"
                    >
                      Post tracking update
                    </button>
                    <button
                        className="button danger"
                        disabled={isCancelled || isDelivered}
                        onClick={cancel}
                        style={{ marginLeft: 10, marginTop: 18 }}
                        type="button"
                    >
                      Cancel shipment
                    </button>
                  </>
              )}
            </form>
            {showDeliveryPopup && (

                <div className="panel">

                  <h3>Confirm Delivery</h3>


                  <input
                      className="input"
                      placeholder="Receiver Name"
                      value={receiverName}
                      onChange={(e)=>setReceiverName(e.target.value)}
                  />


                  <textarea
                      className="textarea"
                      placeholder="Remarks"
                      value={remarks}
                      onChange={(e)=>setRemarks(e.target.value)}
                  />


                  {!otpSent ? (

                      <button
                          className="button primary"
                          onClick={handleSendOtp}
                      >
                        Send OTP
                      </button>

                  ):(

                      <>

                        <input
                            className="input"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e)=>setOtp(e.target.value)}
                        />


                        <button
                            className="button primary"
                            onClick={handleVerifyOtp}
                        >
                          Verify OTP
                        </button>

                      </>

                  )}


                </div>

            )}

            <div className="history-panel">
              <h3 className="section-title">Shipment history</h3>
              <ul className="timeline compact-timeline">
                {[...(shipment.history || [])].reverse().map((event) => (
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
          </div>
        </div>
      </section>
      </>
  );
}

function ShipmentList({ ownOnly = false }) {
  const { auth } = useContext(AuthContext);

  const {
    shipments,
    statuses: contextStatuses,
    updateStatus,
    updateShipment,
    cancelShipment,
    rejectShipment,
    metrics,
    loading,
    error,
    refetch,
  } = useContext(ShipmentContext);

  const statuses = Array.isArray(contextStatuses)
      ? contextStatuses.map((item) => String(item))
      : [];

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedTracking, setSelectedTracking] = useState(null);

  const navigate = useNavigate();

  const role = normalizeRole(auth.user.role);
  const authenticatedUserId = auth?.user?.userId;
  const canEditStatus = editableRoles.includes(role);
  const isShipmentAdmin = shipmentAdminRoles.includes(role);
  const canManageShipments = shipmentManagerRoles.includes(role);
  const visibleShipments = useMemo(() => {
    if (!ownOnly) return shipments;
    if (authenticatedUserId == null) return [];
    return shipments.filter((shipment) => String(shipment.userId) === String(authenticatedUserId));
  }, [authenticatedUserId, ownOnly, shipments]);

  const selectedShipment = visibleShipments.find(
      (shipment) => shipment.trackingNumber === selectedTracking,
  );
  console.log("selectedTracking:", selectedTracking);
  console.log("selectedShipment:", selectedShipment);
  console.log("canManageShipments:", canManageShipments);
  const pendingRequests = useMemo(
      () => visibleShipments.filter((shipment) => shipment.status === "Pending Approval"),
      [visibleShipments],
  );

  const filteredShipments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return visibleShipments.filter((shipment) => {
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
  }, [query, status, visibleShipments]);

  const visibleMetrics = useMemo(() => {
    const total = visibleShipments.length;
    const delivered = visibleShipments.filter((shipment) => shipment.status === "Delivered").length;
    const active = visibleShipments.filter((shipment) => !["Delivered", "Cancelled", "Rejected", "Pending Approval"].includes(shipment.status)).length;
    const delayed = visibleShipments.filter((shipment) => shipment.status === "Failed Delivery").length;
    const pendingApproval = visibleShipments.filter((shipment) => shipment.status === "Pending Approval").length;
    return { total, active, delivered, delayed, pendingApproval };
  }, [visibleShipments]);


  const approveRequest = (shipment) => {
    updateStatus(shipment.trackingNumber, "Created", shipment.senderCity);
  };

  const rejectRequest = (shipment) => {
    if (!window.confirm(`Reject shipment request ${shipment.trackingNumber}?`)) return;
    rejectShipment(shipment.trackingNumber, shipment.senderCity);
  };




  return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="eyebrow">Shipment management</div>
            <h1>{canManageShipments ? "Shipment operations" : "Management dashboard"}</h1>
            <p className="subtle">
              Review shipment information, manage lifecycle updates, and keep a complete tracking history.
            </p>
          </div>
          <Link className="button primary" to="/shipments/new">
            + New shipment
          </Link>
        </div>

        {error && <div className="alert error" style={{ marginBottom: 18 }}>{error}</div>}
        {loading && <div className="alert" style={{ marginBottom: 18 }}>Loading shipments...</div>}
        {ownOnly && authenticatedUserId == null && !loading && (
          <div className="alert error" style={{ marginBottom: 18 }}>Unable to verify your account identity.</div>
        )}

        <section className="grid grid-4" style={{ marginBottom: 18 }}>
          <div className="metric-card"><div className="metric-label">Total</div><div className="metric-value">{ownOnly ? visibleMetrics.total : metrics.total}</div></div>
          <div className="metric-card"><div className="metric-label">Active</div><div className="metric-value">{ownOnly ? visibleMetrics.active : metrics.active}</div></div>
          <div className="metric-card"><div className="metric-label">Delivered</div><div className="metric-value">{ownOnly ? visibleMetrics.delivered : metrics.delivered}</div></div>
          <div className="metric-card"><div className="metric-label">{isShipmentAdmin ? "Pending requests" : "Delayed or failed"}</div><div className="metric-value">{isShipmentAdmin ? (ownOnly ? visibleMetrics.pendingApproval : metrics.pendingApproval) : (ownOnly ? visibleMetrics.delayed : metrics.delayed)}</div></div>
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

        {canManageShipments && selectedShipment && (
            <ShipmentAdminWorkspace
                cancelShipment={cancelShipment}
                close={() => setSelectedTracking(null)}
                key={`${selectedShipment.trackingNumber}-${selectedShipment.status}`}
                rejectShipment={rejectShipment}
                shipment={selectedShipment}
                updateShipment={updateShipment}
                updateStatus={updateStatus}
                refetch={refetch}
            />
        )}

        <section className="panel">
          <div className="toolbar">
            <div className="filters">
              <input
                  className="input"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tracking, sender, receiver, city"
                  style={{ minWidth: 300 }}
                  value={query}
              />

              <select className="select" onChange={(e) => setStatus(e.target.value)} value={status}>
                <option value="All">All</option>
                {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
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
                      <div className="subtle" style={{ fontSize: 12 }}>{shipment.id}</div>
                    </td>

                    <td>
                      <strong>{shipment.senderCity}</strong> to <strong>{shipment.receiverCity}</strong>
                      <div className="subtle" style={{ fontSize: 12 }}>{shipment.receiverName}</div>
                    </td>

                    <td>
                      {shipment.packageType}
                      <div className="subtle" style={{ fontSize: 12 }}>{shipment.weight} - {shipment.priority}</div>
                    </td>

                    <td>
                      <span className={`badge ${statusClass(shipment.status)}`}>{shipment.status}</span>
                    </td>

                    <td style={{ minWidth: 150 }}>
                      <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${Number(shipment.progress || 0)}%` }}
                        />
                      </div>
                      <div className="subtle" style={{ fontSize: 12, marginTop: 4 }}>{shipment.progress}% complete</div>
                    </td>

                    <td>{shipment.eta}</td>

                     <td>
  {canManageShipments ? (
    <>
      <button
        className="button secondary compact"
        onClick={() => setSelectedTracking(shipment.trackingNumber)}
        type="button"
      >
        Manage
      </button>

      {shipment.status === "Delivered" && (
        <button
          className="button primary"
          type="button"
          style={{ marginTop: 18, marginLeft: 10 }}
          onClick={() =>
            navigate("/proof-of-delivery", {
              state: {
                shipmentId: shipment.shipmentId,
                trackingNumber: shipment.trackingNumber,
              },
            })
          }
        >
          Complete Delivery
        </button>
      )}
    </>
  ) : canEditStatus ? (
                          <select
                              className="select"
                              onChange={(e) => updateStatus(shipment.trackingNumber, e.target.value, shipment.receiverCity)}
                              value={shipment.status}
                          >
                            {statuses.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
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
