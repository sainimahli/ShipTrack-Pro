import { useContext, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/auth";
import { ShipmentContext } from "../context/shipments";

/**
 * CreateShipment
 *
 * IMPORTANT — field separation:
 *   - senderName, senderCity  → sender section only
 *   - receiverName, receiverCity → receiver section only
 *   - senderAddressId / receiverAddressId are NOT in the form.
 *     The backend creates/resolves address records automatically from the
 *     city fields, via ShipmentServiceImpl fallback logic.
 *   - ETA is sent as both `eta` and `expectedDeliveryDate` by ShipmentContext.
 */

const initialForm = {
  senderName: "",
  senderCity: "",
  receiverName: "",
  receiverCity: "",
  shipmentType: "STANDARD",
  packageType: "General Cargo",
  weight: "",
  deliveryAddress: "",
  eta: "",
  priority: "Standard",
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
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const role = normalizeRole(auth.user.role);
  const isCustomer = role === "Customer";

  const canCreate = useMemo(() => allowedCreateRoles.includes(role), [role]);

  // Each field is updated independently — sender and receiver never share state.
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!canCreate || submitting) return;

      // Basic client-side guard: sender and receiver must have different cities
      if (
        form.senderCity.trim() &&
        form.receiverCity.trim() &&
        form.senderCity.trim().toLowerCase() ===
          form.receiverCity.trim().toLowerCase() &&
        form.senderName.trim().toLowerCase() ===
          form.receiverName.trim().toLowerCase()
      ) {
        setSubmitError(
          "Sender and receiver appear identical. Please verify the sender and receiver details."
        );
        return;
      }

      setSubmitError(null);
      setSubmitting(true);
      try {
        const requiresApproval = role !== "Administrator";
        const shipment = await createShipment({
          ...form,
          requestStatus: requiresApproval ? "Pending Approval" : "Created",
        });
        setCreated(shipment);
        setForm(initialForm);
      } catch (err) {
        const msg =
          err?.response?.data?.message ??
          err?.response?.data ??
          "Failed to create shipment. Please check all required fields.";
        setSubmitError(typeof msg === "string" ? msg : JSON.stringify(msg));
      } finally {
        setSubmitting(false);
      }
    },
    [canCreate, createShipment, form, role, submitting]
  );

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
          Your current role can view and track shipments but cannot create
          shipment records.
        </div>
      )}

      {submitError && (
        <div className="alert error" style={{ marginBottom: 18 }}>
          {submitError}
        </div>
      )}

      {created && (
        <div className="alert success" style={{ marginBottom: 18 }}>
          Shipment <strong>{created.trackingNumber}</strong>{" "}
          {created.status === "Pending Approval"
            ? "submitted for approval"
            : "created successfully"}
          .
        </div>
      )}

      <form className="panel" onSubmit={handleSubmit}>
        {/* ── Sender Section ─────────────────────────────────────────────── */}
        <fieldset
          style={{
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 20,
          }}
        >
          <legend style={{ fontWeight: 600, padding: "0 8px", color: "#4b5f78" }}>
            📤 Sender
          </legend>
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
                placeholder="e.g. Arun Kumar"
                value={form.senderName}
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
                placeholder="e.g. Chennai"
                value={form.senderCity}
              />
            </div>
          </div>
        </fieldset>

        {/* ── Receiver Section ───────────────────────────────────────────── */}
        <fieldset
          style={{
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 20,
          }}
        >
          <legend style={{ fontWeight: 600, padding: "0 8px", color: "#4b5f78" }}>
            📥 Receiver
          </legend>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="receiverName">Receiver name</label>
              <input
                className="input"
                disabled={!canCreate}
                id="receiverName"
                name="receiverName"
                onChange={handleChange}
                required
                placeholder="e.g. Priya Sharma"
                value={form.receiverName}
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
                placeholder="e.g. Coimbatore"
                value={form.receiverCity}
              />
            </div>
          </div>
        </fieldset>

        {/* ── Package & Shipment Details ─────────────────────────────────── */}
        <fieldset
          style={{
            border: "1px solid var(--border, #e2e8f0)",
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 20,
          }}
        >
          <legend style={{ fontWeight: 600, padding: "0 8px", color: "#4b5f78" }}>
            📦 Package &amp; Shipment Details
          </legend>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="shipmentType">Shipment service type</label>
              <select
                className="select"
                disabled={!canCreate}
                id="shipmentType"
                name="shipmentType"
                onChange={handleChange}
                value={form.shipmentType}
              >
                <option value="STANDARD">STANDARD</option>
                <option value="EXPRESS">EXPRESS</option>
                <option value="SAME_DAY">SAME_DAY</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="packageType">Package type</label>
              <select
                className="select"
                disabled={!canCreate}
                id="packageType"
                name="packageType"
                onChange={handleChange}
                value={form.packageType}
              >
                <option>General Cargo</option>
                <option>Electronics</option>
                <option>Medical Supplies</option>
                <option>Furniture</option>
                <option>Documents</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="weight">Package weight (kg)</label>
              <input
                className="input"
                disabled={!canCreate}
                id="weight"
                name="weight"
                onChange={handleChange}
                required
                placeholder="e.g. 2.5"
                value={form.weight}
              />
            </div>

            <div className="form-field">
              <label htmlFor="eta">Estimated delivery date</label>
              <input
                className="input"
                disabled={!canCreate}
                id="eta"
                name="eta"
                onChange={handleChange}
                required
                type="date"
                value={form.eta}
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
                value={form.priority}
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
                placeholder="Full delivery address for the receiver"
                value={form.deliveryAddress}
              />
            </div>
          </div>
        </fieldset>

        <div className="toolbar" style={{ margin: "22px 0 0" }}>
          <button
            className="button primary"
            disabled={!canCreate || submitting}
            type="submit"
          >
            {submitting
              ? "Saving…"
              : isCustomer
              ? "Request shipment"
              : "Create shipment"}
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
