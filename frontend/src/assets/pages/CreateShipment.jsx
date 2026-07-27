import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/auth";
import { ShipmentContext } from "../context/shipments";

const initialForm = {
  senderName: "",
  senderCity: "",
  receiverName: "",
  receiverCity: "",
  packageType: "General Cargo",
  weight: "",
  deliveryAddress: "",
  eta: "",
  priority: "Standard",
  assignedTo: "Logistics Operator",
};

const roleLabels = {
  CUSTOMER: "Customer",
  BUSINESS_CLIENT: "Business Client",
  LOGISTICS_OPERATOR: "Logistics Operator",
  ADMINISTRATOR: "Administrator",
};

const normalizeRole = (role) => roleLabels[role] || role || "Customer";

const allowedCreateRoles = [
  "Customer",
  "Business Client",
  "Logistics Operator",
  "Administrator",
];

function CreateShipment() {
  const { auth } = useContext(AuthContext);
  const { createShipment } = useContext(ShipmentContext);
  const [form, setForm] = useState(initialForm);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const role = normalizeRole(auth.user.role);
  const isCustomer = role === "Customer";

  const canCreate = useMemo(() => allowedCreateRoles.includes(role), [role]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canCreate) return;

    const requiresApproval = role !== "Administrator";
    try {
      setError("");
      const shipment = await createShipment({
        ...form,
        requestStatus: requiresApproval ? "Pending Approval" : "Created",
      });
      setCreated(shipment);
      setForm(initialForm);
    } catch (requestError) {
      setError(requestError.message || "Unable to create shipment.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Shipment management</div>
          <h1>{isCustomer ? "Request shipment" : "Create shipment"}</h1>
          <p className="subtle">
            {isCustomer
              ? "Submit sender, receiver, package, ETA, and delivery details for pickup."
              : "Capture sender, receiver, package, ETA, and delivery information."}
          </p>
        </div>
        <Link className="button secondary" to="/shipments">
          View shipments
        </Link>
      </div>

      {!canCreate && (
        <div className="alert error" style={{ marginBottom: 18 }}>
          Your current role can view and track shipments but cannot create shipment records.
        </div>
      )}

      {created && (
        <div className="alert success" style={{ marginBottom: 18 }}>
          Shipment {created.trackingNumber} {created.status === "Pending Approval" ? "submitted for approval" : "created"}.
        </div>
      )}

      {error && <div className="alert error" style={{ marginBottom: 18 }}>{error}</div>}

      <form className="panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="senderName">Sender name</label>
            <input
              className="input"
              disabled={!canCreate}
              id="senderName"
              name="senderName"
              onChange={handleChange}
              required
              placeholder="Enter Sender Name"
            />
          </div>

          <div className="form-field">
            <label htmlFor="senderCity">Sender city</label>
            <input
              className="input"
              disabled={!canCreate}
              id="senderCity"
              name="senderCity"
              onChange={handleChange}
              required
              placeholder="Enter Sender City"
            />
          </div>

          <div className="form-field">
            <label htmlFor="receiverName">Receiver name</label>
            <input
              className="input"
              disabled={!canCreate}
              id="receiverName"
              name="receiverName"
              onChange={handleChange}
              required
              placeholder="Enter Receiver Name"
            />
          </div>

          <div className="form-field">
            <label htmlFor="receiverCity">Receiver city</label>
            <input
              className="input"
              disabled={!canCreate}
              id="receiverCity"
              name="receiverCity"
              onChange={handleChange}
              required
              placeholder="Enter Receiver City"
            />
          </div>

          <div className="form-field">
            <label htmlFor="packageType">Package type</label>
            <select
              className="select"
              disabled={!canCreate}
              id="packageType"
              name="packageType"
              onChange={handleChange}
              placeholder="Select Package Type"
            >
              <option>General Cargo</option>
              <option>Electronics</option>
              <option>Medical Supplies</option>
              <option>Furniture</option>
              <option>Documents</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="weight">Package weight</label>
            <input
              className="input"
              disabled={!canCreate}
              id="weight"
              name="weight"
              onChange={handleChange}
              required
              placeholder="Enter Package Weight"
            />
          </div>

          <div className="form-field">
            <label htmlFor="eta">Estimated delivery</label>
            <input
              className="input"
              disabled={!canCreate}
              id="eta"
              name="eta"
              onChange={handleChange}
              required
              type="date"
             placeholder="Enter Estimate Delivery Date"
            />
          </div>

          <div className="form-field">
            <label htmlFor="priority">Priority</label>
            <select
              className="select"
              disabled={!canCreate}
              id="priority"
              name="priority"
              onChange={handleChange}
              placeholder="Select Priority"
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
              disabled={!canCreate}
              id="deliveryAddress"
              name="deliveryAddress"
              onChange={handleChange}
              required
              placeholder="Enter Delivery Address"
            />
          </div>
        </div>

        <div className="toolbar" style={{ margin: "22px 0 0" }}>
          <button className="button primary" disabled={!canCreate} type="submit">
            {isCustomer ? "Request shipment" : "Create shipment"}
          </button>
          <button
            className="button secondary"
            disabled={!canCreate}
            onClick={() => setForm(initialForm)}
            type="button"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateShipment;
