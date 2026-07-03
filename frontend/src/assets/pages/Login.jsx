import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth";

function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "admin@shiptrack.com", password: "admin123" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = login(form);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="auth-page">
      <section className="auth-panel">
        <div className="brand" style={{ paddingInline: 0 }}>
          <div className="brand-mark">ST</div>
          <div>
            <div className="brand-title" style={{ color: "#132238" }}>
              ShipTrack Pro
            </div>
            <div className="brand-subtitle" style={{ color: "#657184" }}>
              Shipment visibility platform
            </div>
          </div>
        </div>

        <div className="eyebrow">Secure access</div>
        <h1>Sign in to operations</h1>
        <p className="subtle">
          Use the seeded administrator account or a registered user to open the dashboard.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="alert error">{error}</div>}

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              name="email"
              onChange={handleChange}
              required
              type="email"
              value={form.email}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              className="input"
              id="password"
              name="password"
              onChange={handleChange}
              required
              type="password"
              value={form.password}
            />
          </div>

          <button className="button primary" type="submit">
            Sign in
          </button>
        </form>

        <p className="auth-switch">
          New user? <Link to="/register">Create an account</Link>
        </p>

        <div className="panel" style={{ marginTop: 24, boxShadow: "none" }}>
          <strong>Demo accounts</strong>
          <p className="subtle" style={{ margin: "8px 0 0" }}>
            admin@shiptrack.com / admin123
          </p>
          <p className="subtle" style={{ margin: "4px 0 0" }}>
            operator@shiptrack.com / operator123
          </p>
        </div>
      </section>

      <section className="auth-visual">
        <div className="auth-visual-inner">
          <h2>From booked shipment to delivery proof, one control tower.</h2>
          <p>
            Milestone 1 establishes authentication, access roles, shipment creation, and tracking
            visibility as the React foundation for the Spring Boot platform.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;
