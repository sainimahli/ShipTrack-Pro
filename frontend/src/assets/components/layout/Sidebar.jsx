import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../context/auth";

const navigation = [
  { to: "/dashboard", label: "Dashboard", icon: "D" },
  { to: "/analytics", label: "Analytics", icon: "A" },
  { to: "/shipments", label: "Shipments", icon: "S" },
  { to: "/shipments/new", label: "Create Shipment", icon: "+" },
  { to: "/track", label: "Track", icon: "T" },
   {
    to: "/routes",
    label: "Route Management",
    icon: "R",
  },
  {
    to: "/route-history",
    label: "Route History",
    icon: "H",
  },

  { to: "/profile", label: "Profile", icon: "P" },
  

];

const roleLabels = {
  CUSTOMER: "Customer",
  BUSINESS_CLIENT: "Business Client",
  LOGISTICS_OPERATOR: "Logistics Operator",
  SUPPORT_AGENT: "Support Agent",
  ADMINISTRATOR: "Administrator",
};

const normalizeRole = (role) => roleLabels[role] || role || "Customer";

const canManageShipments = (role) => role === "Administrator";

const canManageUsers = (role) => role === "Administrator";

const getNavLabel = (item, role) => {
  if (item.to === "/shipments" && canManageShipments(role)) {
    return "Manage Shipments";
  }

  if (item.to === "/shipments/new" && role === "Customer") {
    return "Request Shipment";
  }

  return item.label;
};

function Sidebar() {
  const { auth } = useContext(AuthContext);
  const role = normalizeRole(auth.user.role);

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
            <span>{getNavLabel(item, role)}</span>
          </NavLink>
        ))}

        {canManageUsers(role) && (
          <NavLink className="nav-link" to="/users/manage">
            <span className="nav-icon">U</span>
            <span>Manage Users</span>
          </NavLink>
        )}
      </nav>

      <div className="nav-section-label">Session</div>
      <div style={{ padding: "0 8px", color: "#dce7f3", fontSize: 14 }}>
        <strong>{auth.user.name}</strong>
        <div style={{ color: "#aab8c7", marginTop: 4 }}>{role}</div>
      </div>
    </aside>
  );
}

export default Sidebar;
