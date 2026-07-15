import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRoles, register as registerApi } from "../services/api";

const fallbackRoles = [
  { roleId: 1, roleName: "CUSTOMER" },
  { roleId: 2, roleName: "BUSINESS_CLIENT" },
  { roleId: 3, roleName: "LOGISTICS_OPERATOR" },
  { roleId: 5, roleName: "ADMINISTRATOR" },
  { roleId: 6, roleName: "SUPER_ADMIN" },
];

const formatRoleName = (roleName) =>
  roleName
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const withDefaultRoles = (loadedRoles) => {
  const roleNames = new Set(loadedRoles.map((role) => role.roleName));
  const missingRoles = fallbackRoles.filter((role) => !roleNames.has(role.roleName));

  return [...loadedRoles, ...missingRoles];
};

function Register() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    roleId: "",
    companyName: "",
    gstNumber: "",
    businessType: "",
    website: "",
  });

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoles();
        const loadedRoles = Array.isArray(response.data) ? response.data : [];
        setRoles(withDefaultRoles(loadedRoles));
      } catch (error) {
        console.error("Failed to load roles", error);
        setRoles(fallbackRoles);
      }
    };
    fetchRoles();
  }, []);

  const selectedRole = roles.find((role) => String(role.roleId) === String(form.roleId));
  const isBusinessClient = selectedRole?.roleName === "BUSINESS_CLIENT";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setFeedback({
        type: "error",
        message: "Passwords do not match.",
      });
      return;
    }

    try {
      const registrationForm = { ...form };
      delete registrationForm.confirmPassword;

      const result = await registerApi({
        ...registrationForm,
        phone: registrationForm.phone.trim(),
        roleId: Number(registrationForm.roleId),
      });

      if (result.status === 200 || result.status === 201) {
        setFeedback({
          type: "success",
          message: result.data?.message || "Registration successful.",
        });

        navigate("/login");
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Registration failed.",
      });
    }
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
  <>
    <div className="form-field">
      <label htmlFor="firstName">First Name</label>
      <input
        className="input"
        id="firstName"
        name="firstName"
        value={form.firstName}
        onChange={handleChange}
        required
        placeholder="Enter your first name"
      />
    </div>

    <div className="form-field">
      <label htmlFor="lastName">Last Name</label>
      <input
        className="input"
        id="lastName"
        name="lastName"
        value={form.lastName}
        onChange={handleChange}
        required
        placeholder="Enter your last name"
      />
    </div>

    <div className="form-field">
      <label htmlFor="email">Email</label>
      <input
        className="input"
        id="email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        required
        placeholder="Enter your email"
      />
    </div>

    <div className="form-field">
      <label htmlFor="phone">Mobile Number (Optional)</label>
      <input
        className="input"
        id="phone"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={handleChange}
        placeholder="Enter your mobile number"
      />
    </div>

    <div className="form-field">
      <label htmlFor="password">Password</label>
      <input
        className="input"
        id="password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        required
        minLength={6}
        placeholder="Enter your password"
      />
    </div>

    <div className="form-field">
      <label htmlFor="confirmPassword">Confirm Password</label>
      <input
        className="input"
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange}
        required
        placeholder="Re-enter your password"
      />
    </div>

    <div className="form-field">
      <label htmlFor="roleId">Role</label>
      <select
        className="select"
        id="roleId"
        name="roleId"
        value={form.roleId}
        onChange={handleChange}
        required
      >
        <option value="">Select Role</option>
        {roles.map((role) => (
          <option key={role.roleId} value={role.roleId}>
            {formatRoleName(role.roleName)}
          </option>
        ))}
      </select>
    </div>

    {isBusinessClient && (
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
      Register
    </button>
  </>
</form>

          <p className="auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>

      <section className="auth-visual">
        <div className="auth-visual-inner">
          <h2>Register to Manage Your Shipment</h2>
          <p>
            Join a unified platform where customers, operators, and administrators collaborate to ensure smooth and reliable shipment management.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Register;
