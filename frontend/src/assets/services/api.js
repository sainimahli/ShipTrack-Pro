import axios from "axios";

<<<<<<< HEAD
const apiClient = axios.create({
  baseURL: "/api",
  timeout: 5000,
});

/**
 * Fetch delivery forecast for a tracking number.
 * Falls back to a locally generated mock when the backend endpoint is unavailable.
 */
export function getDeliveryForecast(trackingNumber) {
  if (!trackingNumber) return Promise.reject(new Error("trackingNumber required"));

  const url = `/forecast/${encodeURIComponent(trackingNumber)}`;

  return apiClient.get(url).catch(() => {
    const now = new Date();
    // mock: ETA 2 hours from now
    return Promise.resolve({
      data: {
        predictedDeliveryAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        predictedDelayMinutes: 0,
        confidencePercentage: 88,
        riskLevel: "ON_TRACK",
        reason: "Estimated from last known checkpoint (mock)",
      },
    });
  });
}

export default {
  getDeliveryForecast,
};
=======
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

export default API;
>>>>>>> main
