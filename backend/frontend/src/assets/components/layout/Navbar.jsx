import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/auth";

const titles = {
  "/dashboard": ["Dashboard", ""],
  "/shipments": ["Shipment Management", "Create, monitor, and update shipment lifecycle records"],
  "/shipments/new": ["Create Shipment", "Register a new package into the tracking workflow"],
  "/track": ["Tracking Dashboard", "Search by tracking number and view delivery progress"],
  "/profile": ["Profile & Access", "JWT session preview and role capabilities"],
};

function Navbar() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [title, subtitle] = titles[location.pathname] || titles["/dashboard"];

  const initials = auth.user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
        <div className="avatar">{initials}</div>
        <div>
          <strong>{auth.user.name}</strong>
          <div className="topbar-meta">{auth.user.company}</div>
        </div>
        <button className="button danger" onClick={handleLogout} type="button">
          Sign out
        </button>
      </div>
    </header>
  );
}

export default Navbar;
