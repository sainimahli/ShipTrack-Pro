import axios from "axios";

// Axios instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 5000,
});

// Add JWT token to every request

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// Authentication APIs
// =========================
export const login = (data) => API.post("/auth/login", data);

export const register = (data) => API.post("/auth/register", data);

export const forgotPassword = (data) =>
  API.post("/auth/forgot-password", data);

export const verifyOtp = (data) =>
  API.post("/auth/verify-otp", data);

export const resetPassword = (data) =>
  API.post("/auth/reset-password", data);

// =========================
// Roles
// =========================
export const getRoles = () => API.get("/roles");

// =========================
// Profile
// =========================
export const getProfile = () => API.get("/profile");

export const updateProfile = (data) =>
  API.put("/profile", data);

// =========================
// Notifications
// =========================
export const getNotifications = () =>
  API.get("/notifications");

export const getUnreadNotificationCount = () =>
  API.get("/notifications/unread-count");

export const markNotificationAsRead = (notificationId) =>
  API.put(`/notifications/${notificationId}/read`);

export const markAllNotificationsAsRead = () =>
  API.put("/notifications/read-all");

// =========================
// Delivery Forecast
// =========================
export const getDeliveryForecast = (trackingNumber) =>
  API.get(`/tracking/forecast/${encodeURIComponent(trackingNumber)}`);

export const getForecast = (shipmentId) =>
  API.get(`/forecast/${shipmentId}`);

// =========================
// Admin
// =========================
export const getPendingUsers = () =>
  API.get("/admin/pending-users");

export const getApprovedUsers = () =>
  API.get("/admin/approved-users");

export const getRejectedUsers = () =>
  API.get("/admin/rejected-users");

export const approveUser = (id) =>
  API.put(`/admin/users/${id}/approve`);

export const rejectUser = (id) =>
  API.put(`/admin/users/${id}/reject`);


// Export Axios instance
export default API;

