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

const allowedCreateRoles = ["Business Client", "Logistics Operator", "Administrator"];

function CreateShipment() {
  const { auth } = useContext(AuthContext);
  const { createShipment } = useContext(ShipmentContext);
  const [form, setForm] = useState(initialForm);
  const [created, setCreated] = useState(null);

  const canCreate = useMemo(() => allowedCreateRoles.includes(auth.user.role), [auth.user.role]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canCreate) return;

    const shipment = createShipment(form);
    setCreated(shipment);
    setForm(initialForm);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Shipment management</div>
          <h1>Create shipment</h1>
          <p className="subtle">Capture sender, receiver, package, ETA, and delivery information.</p>
        </div>
        <Link className="button secondary" to="/shipments">
          View shipments
        </Link>
      </div>

      {!canCreate && (
        <div className="alert error" style={{ marginBottom: 18 }}>
          Your current role can view and track shipments but cannot create new records.
        </div>
      )}

      {created && (
        <div className="alert success" style={{ marginBottom: 18 }}>
          Shipment {created.trackingNumber} created and added to the tracking dashboard.
        </div>
      )}

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
              value={form.senderCity}
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
              value={form.receiverCity}
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
            <label htmlFor="weight">Package weight</label>
            <input
              className="input"
              disabled={!canCreate}
              id="weight"
              name="weight"
              onChange={handleChange}
              placeholder="12 kg"
              required
              value={form.weight}
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
              value={form.deliveryAddress}
            />
          </div>
        </div>

        <div className="toolbar" style={{ margin: "22px 0 0" }}>
          <button className="button primary" disabled={!canCreate} type="submit">
            Create shipment
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
