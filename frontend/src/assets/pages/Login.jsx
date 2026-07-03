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
        <div className="auth-panel-content">
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
                placeholder="Enter your email"
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
                placeholder="Enter your password"
              />
            </div>

            <button className="button primary" type="submit">
              Sign in
            </button>
          </form>

          <p className="auth-switch">
            New user? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>

      <section className="auth-visual">
        <div className="auth-visual-inner">
          <div className="auth-visual-copy">
            <h2>From shipment to delivery proof, one control tower.</h2>
            <p>
              Real-time visibility.
              <br />
              Smarter decisions.
              <br />
              Happier customers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
