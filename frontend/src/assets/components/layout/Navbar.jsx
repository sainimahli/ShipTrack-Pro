import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/auth";
import NotificationBell from "./NotificationBell";

const titles = {
  "/dashboard": ["Dashboard", ""],
  "/analytics": ["Analytics Dashboard", "Customer, business, and platform delivery intelligence"],
  "/shipments": ["Shipment Management", "Create, monitor, and update shipment lifecycle records"],
  "/shipments/new": ["Create Shipment", "Register a new package into the tracking workflow"],
  "/track": ["Tracking Dashboard", "Search by tracking number and view delivery progress"],
  "/users/manage": ["Manage Users", "Review pending, approved, and rejected account registrations"],
  "/profile": ["Profile & Access", "JWT session preview and role capabilities"],
  "/signature": ["Customer Signature Verification", "View and download the captured customer signature"],
};

function Navbar() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [title, subtitle] = titles[location.pathname] || titles["/dashboard"];

  // Derive display name from identity fields stored in auth context
  const firstName   = auth?.user?.firstName;
  const displayName = auth?.user?.name ||
    (firstName ? `${firstName} ${auth?.user?.lastName || ""}`.trim() : null) ||
    auth?.user?.email ||
    auth?.user?.role ||
    "User";

  const initials = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        <div className="topbar-meta">{subtitle}</div>
      </div>

      <div className="user-chip">
        <NotificationBell isAuthenticated={Boolean(auth?.token)} />
        <div className="avatar">{initials}</div>
        <div>
         <div>
  <strong>{displayName}</strong>
  <div className="topbar-meta">{auth?.user?.role || "User"}</div>
</div>
        </div>
        <button className="button danger" onClick={handleLogout} type="button">
          Sign out
        </button>
      </div>
    </header>
  );
}

export default Navbar;
