import { createContext } from "react";

export const roleCapabilities = {
  Customer: ["Request shipments", "Track shipments", "View shipment history"],
  CUSTOMER: ["Request shipments", "Track shipments", "View shipment history"],
  "Business Client": ["Control customers", "Create shipments", "Manage shipments", "Track shipments"],
  BUSINESS_CLIENT: ["Control customers", "Create shipments", "Manage shipments", "Track shipments"],
  "Logistics Operator": ["Create shipments", "Update shipment status", "Monitor active routes"],
  LOGISTICS_OPERATOR: ["Create shipments", "Update shipment status", "Monitor active routes"],
  "Support Agent": ["Search shipments", "Assist customers", "Review tracking history"],
  SUPPORT_AGENT: ["Search shipments", "Assist customers", "Review tracking history"],
  Administrator: ["Control operators", "Control business clients", "Control customers", "Create and manage shipments"],
  ADMINISTRATOR: ["Control operators", "Control business clients", "Control customers", "Create and manage shipments"],
};

export const AuthContext = createContext(null);
