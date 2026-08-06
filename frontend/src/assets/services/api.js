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

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const login = (data) => API.post("/auth/login", data);

export const register = (data) => API.post("/auth/register", data);

// Roles
export const getRoles = () => API.get("/roles");

// Profile
export const getProfile = () => API.get("/profile");

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

export const getRouteHistory = (trackingNumber) =>
  API.get(`/tracking/history/${encodeURIComponent(trackingNumber)}`);

export const getTrackingLocation = (trackingNumber) =>
  API.get(`/tracking/location/${encodeURIComponent(trackingNumber)}`);

export const getShipments = () => API.get("/shipments");

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

export const getAdminDashboardAnalytics = () =>
  API.get("/admin/dashboard/analytics");

// ForgotPassword
export const forgotPassword = (data) => API.post("/auth/forgot-password", data);

export const verifyOtp = (data) => API.post("/auth/verify-otp", data);

export const resetPassword = (data) => API.post("/auth/reset-password", data);

// Shipments
export const getShipmentById = (id) => API.get(`/shipments/${id}`);

export const deleteShipment = (id) => API.delete(`/shipments/${id}`);

export const updateTrackingStatus = (data) => API.put("/tracking/status", data);

export const updateTrackingLocation = (data) => API.put("/tracking/location", data);

// Proof of Delivery (Milestone 3)
export const getProofOfDelivery = (podId) =>
  API.get(`/pod/${podId}`);

export const downloadPodSignature = (podId) =>
  API.get(`/pod/${podId}/download/signature`, {
    responseType: "blob",
  });
export default API;
