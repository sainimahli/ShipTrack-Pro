import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../context/auth";

// -----------------------------------------------------------------------
// Role-specific navigation definitions
// -----------------------------------------------------------------------

const CUSTOMER_NAV = [
  { to: "/dashboard",      label: "Dashboard",       icon: "🏠" },
  { to: "/shipments/my",   label: "My Shipments",    icon: "📦" },
  { to: "/shipments/new",  label: "Create Shipment", icon: "➕" },
  { to: "/track",          label: "Track Shipment",  icon: "🔍" },
  { to: "/profile",        label: "Profile",         icon: "👤" },
];

const LOGISTICS_OPERATOR_NAV = [
  { to: "/dashboard",             label: "Dashboard",           icon: "🏠" },
  { to: "/shipments",             label: "Manage Shipments",    icon: "🚚" },
  { to: "/shipments/new",         label: "Create Shipment",     icon: "➕" },
  { to: "/track",                 label: "Track Shipment",      icon: "🔍" },
  { to: "/routes",                label: "Route Management",    icon: "🗺️" },
  { to: "/route-history",         label: "Route History",       icon: "📋" },
  { to: "/analytics",             label: "Analytics",           icon: "📊" },
  { to: "/reports",               label: "Reports",             icon: "📄" },
  { to: "/delivery-confirmation", label: "Delivery Confirm.",   icon: "✅" },
  { to: "/signature",             label: "Signature Verify",    icon: "✍️" },
  { to: "/profile",               label: "Profile",             icon: "👤" },
];

const ADMINISTRATOR_NAV = [
  { to: "/dashboard",             label: "Dashboard",           icon: "🏠" },
  { to: "/analytics",             label: "Analytics",           icon: "📊" },
  { to: "/shipments",             label: "Manage Shipments",    icon: "🚚" },
  { to: "/shipments/new",         label: "Create Shipment",     icon: "➕" },
  { to: "/track",                 label: "Track Shipment",      icon: "🔍" },
  { to: "/routes",                label: "Route Management",    icon: "🗺️" },
  { to: "/route-history",         label: "Route History",       icon: "📋" },
  { to: "/reports",               label: "Reports",             icon: "📄" },
  { to: "/delivery-confirmation", label: "Delivery Confirm.",   icon: "✅" },
  { to: "/users/manage",          label: "Manage Users",        icon: "👥" },
  { to: "/signature",             label: "Signature Verify",    icon: "✍️" },
  { to: "/profile",               label: "Profile",             icon: "👤" },
];

const BUSINESS_CLIENT_NAV = [
  { to: "/dashboard",      label: "Dashboard",           icon: "🏠" },
  { to: "/shipments",      label: "Shipments",           icon: "🚚" },
  { to: "/shipments/new",  label: "Create Shipment",     icon: "➕" },
  { to: "/track",          label: "Track Shipment",      icon: "🔍" },
  { to: "/profile",        label: "Profile",             icon: "👤" },
];

const SUPPORT_AGENT_NAV = [
  { to: "/dashboard",      label: "Dashboard",           icon: "🏠" },
  { to: "/shipments",      label: "Shipments",           icon: "🚚" },
  { to: "/track",          label: "Track Shipment",      icon: "🔍" },
  { to: "/profile",        label: "Profile",             icon: "👤" },
];

// -----------------------------------------------------------------------
// Role normalisation
// -----------------------------------------------------------------------

const roleLabels = {
  CUSTOMER:           "Customer",
  BUSINESS_CLIENT:    "Business Client",
  LOGISTICS_OPERATOR: "Logistics Operator",
  SUPPORT_AGENT:      "Support Agent",
  ADMINISTRATOR:      "Administrator",
};

const normalizeRole = (role) => roleLabels[role] || role || "Customer";

function getNavForRole(role) {
  switch (role) {
    case "Administrator":      return ADMINISTRATOR_NAV;
    case "Logistics Operator": return LOGISTICS_OPERATOR_NAV;
    case "Business Client":    return BUSINESS_CLIENT_NAV;
    case "Support Agent":      return SUPPORT_AGENT_NAV;
    default:                   return CUSTOMER_NAV; // CUSTOMER and unknown roles
  }
}

// -----------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------

function Sidebar() {
  const { auth } = useContext(AuthContext);
  const role = normalizeRole(auth?.user?.role);

  // Build display name from auth context identity fields
  const firstName   = auth?.user?.firstName;
  const displayName = auth?.user?.name ||
    (firstName ? `${firstName} ${auth?.user?.lastName || ""}`.trim() : null) ||
    auth?.user?.email ||
    role;

  const navItems = getNavForRole(role);

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">ST</div>
        <div>
          <div className="brand-title">ShipTrack Pro</div>
          <div className="brand-subtitle">Delivery visibility platform</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="nav-section-label">Navigation</div>
      <nav>
        {navItems.map((item) => (
          <NavLink className="nav-link" key={item.to} to={item.to}>
            <span className="nav-icon" style={{ fontSize: "1rem" }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Session info */}
      <div className="nav-section-label">Session</div>
      <div style={{ padding: "0 8px", color: "#dce7f3", fontSize: 14 }}>
        <strong>{displayName}</strong>
        <div style={{ color: "#aab8c7", marginTop: 4 }}>{role}</div>
      </div>
    </aside>
  );
}

export default Sidebar;
