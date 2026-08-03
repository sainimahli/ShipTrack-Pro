import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
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

// Milestone 2: live delivery monitoring and ETA forecasting
export const getDeliveryForecast = (trackingNumber) =>
  API.get(`/tracking/forecast/${encodeURIComponent(trackingNumber)}`);

export const getMapConfig = () => API.get("/tracking/map-config");

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

// Shipment APIs
export const createShipment = (data) => API.post("/shipments", data);
export const getShipments = () => API.get("/shipments");
export const getShipmentById = (id) => API.get(`/shipments/${id}`);
export const updateShipment = (id, data) => API.put(`/shipments/${id}`, data);
export const deleteShipment = (id) => API.delete(`/shipments/${id}`);

// Tracking APIs
export const getTrackingStatus = (trackingNumber) => API.get(`/tracking/${encodeURIComponent(trackingNumber)}`);
export const getTrackingTimeline = (trackingNumber) => API.get(`/tracking/timeline/${encodeURIComponent(trackingNumber)}`);
export const updateTrackingStatus = (data) => API.put("/tracking/status", data);
export const updateTrackingLocation = (data) => API.post("/tracking/location", data);

// Route History APIs
export const saveRouteHistory = (data) => API.post("/route-history", data);
export const getRouteHistory = (shipmentId) => API.get(`/route-history/${encodeURIComponent(shipmentId)}`);
export const deleteRouteHistory = (id) => API.delete(`/route-history/${id}`);

// Profile API
export const getProfile = () => API.get("/profile");

export default API;
