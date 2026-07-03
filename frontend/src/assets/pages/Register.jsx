import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth";

const roles = ["Customer", "Business Client", "Logistics Operator", "Support Agent", "Administrator"];

function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Customer",
    company: "",
  });

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = register(form);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="auth-page">
      <section className="auth-panel">
        <div className="eyebrow">Account setup</div>
        <h1>Create your ShipTrack account</h1>
        <p className="subtle">Choose the role that matches your milestone workflow access.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="alert error">{error}</div>}

          <div className="form-field">
            <label htmlFor="name">Full name</label>
            <input
              className="input"
              id="name"
              name="name"
              onChange={handleChange}
              required
              value={form.name}
            />
          </div>

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
              minLength={6}
              name="password"
              onChange={handleChange}
              required
              type="password"
              value={form.password}
            />
          </div>

          <div className="form-field">
            <label htmlFor="role">Role</label>
            <select className="select" id="role" name="role" onChange={handleChange} value={form.role}>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="company">Company</label>
            <input
              className="input"
              id="company"
              name="company"
              onChange={handleChange}
              value={form.company}
            />
          </div>

          <button className="button primary" type="submit">
            Create account
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>

      <section className="auth-visual">
        <div className="auth-visual-inner">
          <h2>Role-based access from the first sprint.</h2>
          <p>
            Customers, operators, support agents, business clients, and administrators each land in
            the same core platform with permissions ready for backend enforcement.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Register;
