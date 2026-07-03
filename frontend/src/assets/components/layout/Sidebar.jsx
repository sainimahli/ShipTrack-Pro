import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../context/auth";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: "D" },
  { to: "/shipments", label: "Shipments", icon: "S" },
  { to: "/shipments/new", label: "Create Shipment", icon: "+" },
  { to: "/track", label: "Track", icon: "T" },
  { to: "/profile", label: "Profile", icon: "P" },
];

function Sidebar() {
  const { auth } = useContext(AuthContext);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">ST</div>
        <div>
          <div className="brand-title">ShipTrack Pro</div>
          <div className="brand-subtitle">Delivery visibility platform</div>
        </div>
      </div>

      <div className="nav-section-label">Core</div>
      <nav>
        {navigation.map((item) => (
          <NavLink className="nav-link" key={item.to} to={item.to}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="nav-section-label">Session</div>
      <div style={{ padding: "0 8px", color: "#dce7f3", fontSize: 14 }}>
        <strong>{auth.user.name}</strong>
        <div style={{ color: "#aab8c7", marginTop: 4 }}>{auth.user.role}</div>
      </div>
    </aside>
  );
}

export default Sidebar;
