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

// Route Calculation
export const calculateRoute = (originCity, destinationCity, trackingNumber) =>
  API.post("/route/calculate", {
    originCity,
    destinationCity,
    ...(trackingNumber ? { trackingNumber } : {}),
  });

// Admin
export const getPendingUsers = () => API.get("/admin/pending-users");

export const getApprovedUsers = () => API.get("/admin/approved-users");

export const getRejectedUsers = () => API.get("/admin/rejected-users");

export const approveUser = (id) => API.put(`/admin/users/${id}/approve`);

export const rejectUser = (id) => API.put(`/admin/users/${id}/reject`);

// ForgotPassword
export const forgotPassword = (data) => API.post("/auth/forgot-password", data);

export const verifyOtp = (data) => API.post("/auth/verify-otp", data);

export const resetPassword = (data) => API.post("/auth/reset-password", data);

// Shipments
export const getShipments = () => API.get("/shipments");

export const getShipmentById = (id) => API.get(`/shipments/${id}`);

export const createShipment = (data) => API.post("/shipments", data);

export const updateShipment = (id, data) => API.put(`/shipments/${id}`, data);

export const deleteShipment = (id) => API.delete(`/shipments/${id}`);

export const updateTrackingStatus = (data) => API.put("/tracking/status", data);

export const getTrackingTimeline = (trackingNumber) =>
  API.get(`/tracking/timeline/${encodeURIComponent(trackingNumber)}`);

export const updateTrackingLocation = (data) => API.put("/tracking/location", data);

export const getTrackingLocation = (trackingNumber) =>
  API.get(`/tracking/location/${encodeURIComponent(trackingNumber)}`);

export default API;
