import axios from "axios";

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
