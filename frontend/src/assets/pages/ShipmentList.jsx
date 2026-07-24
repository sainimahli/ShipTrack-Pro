import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/auth";
import { ShipmentContext } from "../context/shipments";
import { loadGoogleMaps } from "../services/mapsLoader";

const roleLabels = {
  BUSINESS_CLIENT: "Business Client",
  LOGISTICS_OPERATOR: "Logistics Operator",
  ADMINISTRATOR: "Administrator",
};

const normalizeRole = (role) => roleLabels[role] || role || "Customer";
const editableRoles = ["Business Client", "Logistics Operator", "Administrator"];
const shipmentAdminRoles = ["Administrator"];

function statusClass(status) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

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
  const [location, setLocation] = useState(shipment.receiverCity);
  const [notice, setNotice] = useState("");
  const isCancelled = shipment.status === "Cancelled";
  const isDelivered = shipment.status === "Delivered";
  const isPendingApproval = shipment.status === "Pending Approval";

  const saveDetails = (event) => {
    event.preventDefault();
    updateShipment(shipment.trackingNumber, details);
    setNotice("Shipment information and package details updated.");
  };

  const saveStatus = (event) => {
    event.preventDefault();
    if (nextStatus === shipment.status) return;
    updateStatus(shipment.trackingNumber, nextStatus, location);
    setNotice(`Status updated to ${nextStatus}. A tracking event was added.`);
  };

  const cancel = () => {
    if (!window.confirm(`Cancel shipment ${shipment.trackingNumber}? This action is recorded in its history.`)) {
      return;
    }
    cancelShipment(shipment.trackingNumber, location);
    setNotice("Shipment cancelled and retained in tracking history.");
  };

  const approveRequest = () => {
    updateStatus(shipment.trackingNumber, "Created", location || shipment.senderCity);
    setNotice("Shipment request approved. The shipment is ready for lifecycle updates.");
  };

  const rejectRequest = () => {
    if (!window.confirm(`Reject shipment request ${shipment.trackingNumber}?`)) return;
    rejectShipment(shipment.trackingNumber, location || shipment.senderCity);
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
                {statuses.filter((item) => !["Pending Approval", "Rejected"].includes(item)).map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ marginTop: 14 }}>
              <label htmlFor="location">Current location</label>
              <input className="input" disabled={isCancelled || isDelivered} id="location" onChange={(e) => setLocation(e.target.value)} required value={location} />
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



function AdminFleetMap({ shipments, setSelectedTracking }) {
  const [mapProvider, setMapProvider] = useState("loading");
  const [googleInstance, setGoogleInstance] = useState(null);
  const [leafletReady, setLeafletReady] = useState(false);

  useEffect(() => {
    let timeoutId = setTimeout(() => {
      console.warn("Google Maps load timed out, falling back to Leaflet.");
      setMapProvider("leaflet");
    }, 3500);

    loadGoogleMaps()
      .then((google) => {
        clearTimeout(timeoutId);
        setGoogleInstance(google);
        setMapProvider("google");
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("Google Maps failed to load inside AdminFleetMap:", err);
        setMapProvider("leaflet");
      });

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (mapProvider !== "google" || !googleInstance || !shipments.length) return;

    const container = document.getElementById("admin-fleet-map");
    if (!container) return;

    const google = googleInstance;
    const activeShipments = shipments.filter(
      (s) => !["Delivered", "Cancelled", "Rejected"].includes(s.status)
    );

    const map = new google.maps.Map(container, {
      center: { lat: 20.5937, lng: 78.9629 }, // Center of India
      zoom: 5,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    const markers = [];
    activeShipments.forEach((shipment) => {
      const latestEvent = shipment.history?.at(-1);
      const locName = latestEvent?.location || shipment.senderCity;
      const coords = latestEvent?.latitude != null && latestEvent?.longitude != null
        ? { lat: Number(latestEvent.latitude), lng: Number(latestEvent.longitude) }
        : getCoords(locName);

      let iconColor = "blue";
      if (shipment.priority === "Critical") iconColor = "red";
      else if (shipment.priority === "Express") iconColor = "orange";

      const marker = new google.maps.Marker({
        position: coords,
        map: map,
        title: shipment.trackingNumber,
        icon: `https://maps.google.com/mapfiles/ms/icons/${iconColor}-dot.png`
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
            <h4 style="margin: 0 0 6px 0; color: #1e293b;">${shipment.trackingNumber}</h4>
            <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
              <b>Status:</b> ${shipment.status}<br/>
              <b>Route:</b> ${shipment.senderCity} to ${shipment.receiverCity}<br/>
              <b>Priority:</b> ${shipment.priority}<br/>
              <b>Current Location:</b> ${locName}
            </div>
            <button 
              style="background: #2563eb; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; width: 100%; font-weight: bold;"
              onclick="window.selectShipment('${shipment.trackingNumber}')"
            >
              Manage Shipment
            </button>
          </div>
        `
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      markers.push(marker);
    });

    window.selectShipment = (trackingNumber) => {
      setSelectedTracking(trackingNumber);
    };

    return () => {
      markers.forEach((m) => m.setMap(null));
      trafficLayer.setMap(null);
      delete window.selectShipment;
    };
  }, [googleReady, googleInstance, shipments, setSelectedTracking, mapProvider]);

  useEffect(() => {
    if (mapProvider !== "leaflet") return;
    if (window.L) {
      setLeafletReady(true);
      return;
    }

    const cssExists = document.getElementById("leaflet-css");
    if (!cssExists) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.id = "leaflet-css";
      document.head.appendChild(link);
    }

    const jsExists = document.getElementById("leaflet-js");
    if (!jsExists) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.id = "leaflet-js";
      script.onload = () => setLeafletReady(true);
      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          setLeafletReady(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [mapProvider]);

  useEffect(() => {
    if (mapProvider !== "leaflet" || !leafletReady || !window.L || !shipments.length) return;

    const container = document.getElementById("admin-fleet-map");
    if (!container) return;

    const L = window.L;
    const activeShipments = shipments.filter(
      (s) => !["Delivered", "Cancelled", "Rejected"].includes(s.status)
    );

    const map = L.map("admin-fleet-map", {
      zoomControl: true,
      attributionControl: false
    }).setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const createCustomIcon = (color) => {
      return L.divIcon({
        className: 'custom-map-marker',
        html: `<div class="marker-pin" style="background-color: ${color}"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });
    };

    const markers = [];
    activeShipments.forEach((shipment) => {
      const latestEvent = shipment.history?.at(-1);
      const locName = latestEvent?.location || shipment.senderCity;
      const coords = latestEvent?.latitude != null && latestEvent?.longitude != null
        ? { lat: Number(latestEvent.latitude), lng: Number(latestEvent.longitude) }
        : getCoords(locName);

      let iconColor = '#2563eb';
      if (shipment.priority === "Critical") iconColor = '#ef4444';
      else if (shipment.priority === "Express") iconColor = '#f97316';

      const marker = L.marker([coords.lat, coords.lng], {
        icon: createCustomIcon(iconColor)
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px; padding: 2px;">
          <h4 style="margin: 0 0 6px 0; color: #1e293b; font-size: 13px;">${shipment.trackingNumber}</h4>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px; line-height: 1.4;">
            <b>Status:</b> ${shipment.status}<br/>
            <b>Route:</b> ${shipment.senderCity} to ${shipment.receiverCity}<br/>
            <b>Priority:</b> ${shipment.priority}<br/>
            <b>Current:</b> ${locName}
          </div>
          <button 
            style="background: #2563eb; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 10px; cursor: pointer; width: 100%; font-weight: bold;"
            onclick="window.selectShipment('${shipment.trackingNumber}')"
          >
            Manage Shipment
          </button>
        </div>
      `);

      markers.push(marker);
    });

    window.selectShipment = (trackingNumber) => {
      setSelectedTracking(trackingNumber);
    };

    return () => {
      map.remove();
      delete window.selectShipment;
    };
  }, [mapProvider, leafletReady, shipments, setSelectedTracking]);

  return (
    <section className="panel" style={{ marginBottom: 18 }}>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <div>
          <div className="eyebrow">Real-time operation control</div>
          <h2 className="section-title" style={{ marginTop: 6 }}>Live Fleet Monitor Map</h2>
          <p className="subtle">Monitor positions, statuses, and priority flags for all active delivery vehicles and routes.</p>
        </div>
      </div>
      <div style={{ position: "relative", width: "100%", height: 350 }}>
        <div 
          id="admin-fleet-map" 
          style={{ width: "100%", height: "100%", borderRadius: 12, border: "1px solid #e2e8f0" }} 
        />
        {mapProvider === "loading" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 12 }}>
            <p className="subtle">Loading fleet monitor map...</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ShipmentList() {
  const { auth } = useContext(AuthContext);
  const { shipments, statuses, updateStatus, updateShipment, cancelShipment, rejectShipment, metrics } = useContext(ShipmentContext);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedTracking, setSelectedTracking] = useState(null);
  const role = normalizeRole(auth.user.role);
  const canEditStatus = editableRoles.includes(role);
  const isShipmentAdmin = shipmentAdminRoles.includes(role);
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
      <div className="page-header"><div><div className="eyebrow">Shipment management</div><h1>{isShipmentAdmin ? "Shipment operations" : "Management dashboard"}</h1><p className="subtle">Review shipment information, manage lifecycle updates, and keep a complete tracking history.</p></div><Link className="button primary" to="/shipments/new">+ New shipment</Link></div>

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

      {isShipmentAdmin && selectedShipment && <ShipmentAdminWorkspace cancelShipment={cancelShipment} close={() => setSelectedTracking(null)} key={`${selectedShipment.trackingNumber}-${selectedShipment.status}`} rejectShipment={rejectShipment} shipment={selectedShipment} statuses={statuses} updateShipment={updateShipment} updateStatus={updateStatus} />}

      {isShipmentAdmin && (
        <AdminFleetMap shipments={shipments} setSelectedTracking={setSelectedTracking} />
      )}

      <section className="panel">
        <div className="toolbar"><div className="filters"><input className="input" onChange={(e) => setQuery(e.target.value)} placeholder="Search tracking, sender, receiver, city" style={{ minWidth: 300 }} value={query} /><select className="select" onChange={(e) => setStatus(e.target.value)} value={status}><option>All</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></div><span className="subtle">{filteredShipments.length} visible records</span></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Tracking</th><th>Route</th><th>Package</th><th>Status</th><th>Progress</th><th>ETA</th><th>Action</th></tr></thead><tbody>{filteredShipments.map((shipment) => <tr key={shipment.id}><td><strong>{shipment.trackingNumber}</strong><div className="subtle" style={{ fontSize: 12 }}>{shipment.id}</div></td><td><strong>{shipment.senderCity}</strong> to <strong>{shipment.receiverCity}</strong><div className="subtle" style={{ fontSize: 12 }}>{shipment.receiverName}</div></td><td>{shipment.packageType}<div className="subtle" style={{ fontSize: 12 }}>{shipment.weight} - {shipment.priority}</div></td><td><span className={`badge ${statusClass(shipment.status)}`}>{shipment.status}</span></td><td style={{ minWidth: 150 }}><div className="progress-track"><div className="progress-fill" style={{ width: `${shipment.progress}%` }} /></div><div className="subtle" style={{ fontSize: 12, marginTop: 4 }}>{shipment.progress}% complete</div></td><td>{shipment.eta}</td><td>{isShipmentAdmin ? <button className="button secondary compact" onClick={() => setSelectedTracking(shipment.trackingNumber)} type="button">Manage</button> : canEditStatus ? <select className="select" onChange={(e) => updateStatus(shipment.trackingNumber, e.target.value, shipment.receiverCity)} value={shipment.status}>{statuses.map((item) => <option key={item}>{item}</option>)}</select> : <Link className="button secondary" to="/track">Track</Link>}</td></tr>)}</tbody></table></div>
        {filteredShipments.length === 0 && <div className="empty-state">No shipments match the selected filters.</div>}
      </section>
    </div>
  );
}

export default ShipmentList;
