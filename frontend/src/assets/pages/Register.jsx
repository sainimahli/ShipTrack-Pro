import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth";

const roles = ["Customer", "Business Client", "Logistics Operator", "Support Agent", "Administrator"];

function Register() {
  const { register, requestOtp, verifyOtp, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [step, setStep] = useState("details");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Customer",
    companyName: "",
    gstNumber: "",
    businessType: "",
    website: "",
  });

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleOtpChange = (event) => {
    setOtp(event.target.value);
  };

  const handleGoogleSignup = () => {
    const result = googleLogin(null, {
      name: form.name || "Google User",
      email: form.email || "google.user@shiptrack.com",
      role: form.role,
      company: form.company || "Google Workspace",
    });

    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    setFeedback({ type: "success", message: "Signed up with Google." });
    navigate("/dashboard", { replace: true });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (step === "details") {
      if (form.password.length < 6) {
        setFeedback({ type: "error", message: "Use a password with at least 6 characters." });
        return;
      }

      const result = requestOtp({ email: form.email, purpose: "signup" });
      if (!result.ok) {
        setFeedback({ type: "error", message: result.message });
        return;
      }

      setStep("verify");
      setFeedback({ type: "success", message: result.message });
      return;
    }

    const verified = verifyOtp({ email: form.email, otp, purpose: "signup" });
    if (!verified.ok) {
      setFeedback({ type: "error", message: verified.message });
      return;
    }

    const result = register(form);
    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    setFeedback({ type: "success", message: "Account created successfully." });
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

          <div className="eyebrow">Account setup</div>
          <h1>Create your ShipTrack account</h1>
          <p className="subtle">Choose the role that matches your milestone workflow access.</p>

          {feedback.message && <div className={`alert ${feedback.type}`}>{feedback.message}</div>}

          
          <form className="auth-form" onSubmit={handleSubmit}>
            {step === "details" ? (
              <>
                <div className="form-field">
                  <label htmlFor="name">Full name</label>
                  <input
                    className="input"
                    id="name"
                    name="name"
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
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
                    placeholder="Enter your email"
                    value={form.email}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="password">Password</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      className="input"
                      id="password"
                      minLength={6}
                      name="password"
                      onChange={handleChange}
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={form.password}
                      style={{ paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "#657184",
                        fontWeight: "500",
                      }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
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

                {form.role === "Business Client" && (
  <>
    <div className="form-field">
      <label>Company Name</label>
      <input
        className="input"
        name="companyName"
        value={form.companyName}
        onChange={handleChange}
        placeholder="Enter company name"
      />
    </div>

    <div className="form-field">
      <label>GST Number</label>
      <input
        className="input"
        name="gstNumber"
        value={form.gstNumber}
        onChange={handleChange}
        placeholder="Enter GST number"
      />
    </div>

    <div className="form-field">
      <label>Business Type</label>
      <input
        className="input"
        name="businessType"
        value={form.businessType}
        onChange={handleChange}
        placeholder="e.g. Logistics"
      />
    </div>

    <div className="form-field">
      <label>Website</label>
      <input
        className="input"
        type="url"
        name="website"
        value={form.website}
        onChange={handleChange}
        placeholder="https://example.com"
      />
    </div>
  </>
)}

                

                <button className="button primary" type="submit">
                  Send verification code
                </button>
              </>
            ) : (
              <>
                <div className="auth-otp-card">
                  <div className="eyebrow">Email verification</div>
                  <p className="subtle">
                    Enter the one-time code you received to finish creating your account.
                  </p>
                  <div className="form-field">
                    <label htmlFor="otp">Verification code</label>
                    <input
                      className="input"
                      id="otp"
                      name="otp"
                      onChange={handleOtpChange}
                      required
                      placeholder="Enter the 6-digit code"
                      value={otp}
                    />
                  </div>
                </div>
                <button className="button primary" type="submit">
                  Verify and create account
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    setStep("details");
                    setFeedback({ type: "", message: "" });
                  }}
                >
                  Edit details
                </button>
              </>
            )}
          </form>

          <p className="auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
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
