import axios from "axios";

const API = axios.create({
  // In local development Vite proxies this to Spring Boot, avoiding browser CORS.
  // Deployments can set VITE_API_BASE_URL to their public backend API URL.
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Authentication APIs
export const login = (data) => API.post("/auth/login", data);

export const register = (data) => API.post("/auth/register", data);

// Roles
export const getRoles = () => API.get("/roles");

// Profile
export const getProfile = () => API.get("/profile");
export const getAccountActivity = () =>
    API.get("/api/account/activity");
export const updateProfile = (data) => API.put("/profile", data);

// Notifications
export const getNotifications = () => API.get("/notifications");

export const getUnreadNotificationCount = () =>
  API.get("/notifications/unread-count");

export const markNotificationAsRead = (notificationId) =>
  API.put(`/notifications/${notificationId}/read`);

export const markAllNotificationsAsRead = () =>
  API.put("/notifications/read-all");

// Milestone 2: live delivery monitoring and ETA forecasting
export const getDeliveryForecast = (trackingNumber) =>
  API.get(`/tracking/forecast/${encodeURIComponent(trackingNumber)}`);


export const getETA = (trackingNumber) =>
  API.get(`/eta/${encodeURIComponent(trackingNumber)}`);

// Live tracking and shipment alerts
export const getTrackingStatus = (trackingNumber) =>
  API.get(`/tracking/${encodeURIComponent(trackingNumber)}`);

export const getTrackingTimeline = (trackingNumber) =>
  API.get(`/tracking/timeline/${encodeURIComponent(trackingNumber)}`);




export const getTrackingLocation = (trackingNumber) =>
  API.get(`/tracking/location/${encodeURIComponent(trackingNumber)}`);

/**
 * Fetch shipments for the authenticated user.
 * The backend automatically scopes results:
 *   CUSTOMER          → only that customer's shipments
 *   LOGISTICS_OPERATOR / ADMINISTRATOR → all shipments
 */
export const getShipments = () => API.get("/shipments");

/** Alias used explicitly by customer-facing components for clarity. */
export const getMyShipments = () => API.get("/shipments");

export const createShipment = (data) => API.post("/shipments", data);

export const updateShipment = (shipmentId, data) => API.put(`/shipments/${shipmentId}`, data);

export const cancelShipment = (shipmentId) => API.delete(`/shipments/${shipmentId}`);

export const updateShipmentStatus = (data) => API.put("/tracking/status", data);

export const getShipmentAlerts = (shipmentId) =>
  API.get(`/shipments/${shipmentId}/alerts`);

export const markAlertAsRead = (alertId) => API.put(`/alerts/${alertId}/read`);

export const predictShipmentDelay = (shipmentId, signals = {}) =>
  API.post(`/shipments/${shipmentId}/predict-delay`, signals);

// Route Calculation
export const calculateRoute = (params) =>
  API.post("/route/calculate", params);


// Admin
export const getPendingUsers = () => API.get("/admin/pending-users");

export const getApprovedUsers = () => API.get("/admin/approved-users");

export const getRejectedUsers = () => API.get("/admin/rejected-users");

export const approveUser = (id) => API.put(`/admin/users/${id}/approve`);

export const rejectUser = (id) => API.put(`/admin/users/${id}/reject`);
// Admin Analytics
export const getAdminDashboardAnalytics = () =>
    API.get("/admin/dashboard/analytics");

export const getCustomerDashboardAnalytics = () =>
  API.get("/dashboard/customer");

export const getBusinessDashboardAnalytics = () =>
  API.get("/dashboard/business");

/**
 * Fetch admin/logistics analytics summary.
 * Backend: GET /api/admin/dashboard/analytics
 * Returns 403 for non-admin roles — Reports.jsx handles this gracefully.
 */
export const getAnalyticsDashboard = () =>
  API.get("/admin/dashboard/analytics");

/**
 * Download a shipment report as CSV or PDF.
 * Backend: GET /api/reports/{type}/{format}
 * type: "weekly" | "monthly" | "performance"
 * format: "csv" | "pdf"
 */
export const downloadReport = (type, format) =>
  API.get(`/reports/${encodeURIComponent(type)}/${encodeURIComponent(format)}`, {
    responseType: "arraybuffer",
  });

// ForgotPassword
export const forgotPassword = (data) => API.post("/auth/forgot-password", data);

export const verifyOtp = (data) => API.post("/auth/verify-otp", data);

export const resetPassword = (data) => API.post("/auth/reset-password", data);

// Shipments
export const getShipmentById = (id) => API.get(`/shipments/${id}`);

export const deleteShipment = (id) => API.delete(`/shipments/${id}`);

export const updateTrackingStatus = (data) => API.put("/tracking/status", data);

export const updateTrackingLocation = (data) => API.put("/tracking/location", data);


export const sendDeliveryOtp = (shipmentId) =>
    API.post(`/shipments/${shipmentId}/delivery-confirmation/send-otp`);


export const verifyDeliveryOtp = (shipmentId, data) =>
    API.post(
        `/shipments/${shipmentId}/delivery-confirmation/verify-otp`,
        data
    );


export const getDeliveryConfirmation = (shipmentId) =>
    API.get(`/shipments/${shipmentId}/delivery-confirmation`);


/**
 * Assign a driver to a shipment.
 * Backend: PUT /api/shipments/{shipmentId}/assign-driver/{driverId}
 * The driverId is a PATH variable — not a request body.
 */
export const assignDriverToShipment = (shipmentId, driverId) =>
    API.put(`/shipments/${shipmentId}/assign-driver/${driverId}`);

/**
 * Assign a vehicle to a shipment.
 * Backend: PUT /api/shipments/{shipmentId}/assign-vehicle/{vehicleId}
 */
export const assignVehicleToShipment = (shipmentId, vehicleId) =>
    API.put(`/shipments/${shipmentId}/assign-vehicle/${vehicleId}`);

export const getDriverLocation = (driverId) =>
    API.get(`/drivers/${driverId}/location`);

// Route History
export const getRouteHistory = (trackingNumber) =>
    API.get(`/tracking/history/${encodeURIComponent(trackingNumber)}`);

// Proof of Delivery
export const getProofOfDelivery = (podId) =>
    API.get(`/pod/${podId}`);

// Download POD Signature
export const downloadPodSignature = (podId) =>
    API.get(`/pod/${podId}/download/signature`, {
        responseType: "blob",
    });


export default API;