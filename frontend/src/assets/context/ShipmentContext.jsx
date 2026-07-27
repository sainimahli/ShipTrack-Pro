import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ShipmentContext } from "./shipments";
import { AuthContext } from "./auth";
import {
  cancelShipment as cancelShipmentRequest,
  createShipment as createShipmentRequest,
  getShipments,
  updateShipment as updateShipmentRequest,
  updateShipmentStatus,
} from "../services/api";

const statusProgress = {
  Created: 12, "Picked Up": 28, "In Transit": 58, "Out for Delivery": 84,
  Delivered: 100, "Failed Delivery": 72, Returned: 0, Cancelled: 0,
};

const toUiShipment = (shipment) => ({
  ...shipment,
  id: shipment.shipmentId,
  trackingNumber: shipment.trackingNumber,
  senderName: shipment.senderName || "Sender",
  senderCity: shipment.senderCity || "",
  receiverName: shipment.receiverName || "Receiver",
  receiverCity: shipment.receiverCity || "",
  packageType: shipment.packageType || shipment.shipmentType || "General Cargo",
  weight: shipment.weight || (shipment.totalWeightKg ? `${shipment.totalWeightKg} kg` : ""),
  deliveryAddress: shipment.deliveryAddress || "",
  eta: shipment.eta || shipment.expectedDeliveryDate || "",
  priority: shipment.priority || "Standard",
  status: shipment.status || shipment.shipmentStatus?.replaceAll("_", " ") || "Created",
  progress: shipment.progress ?? statusProgress[shipment.status] ?? 0,
  createdAt: shipment.createdAt?.slice(0, 10),
  history: shipment.history || [],
});

const errorMessage = (error) => error.response?.data?.message || error.response?.data?.error || error.message || "Unable to update shipment.";

export function ShipmentProvider({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshShipments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getShipments();
      setShipments(response.data.map(toUiShipment));
      setError("");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshShipments();
    } else {
      setShipments([]);
      setError("");
      setLoading(false);
    }
  }, [isAuthenticated, refreshShipments]);

  const createShipment = useCallback(async (shipment) => {
    try {
      const response = await createShipmentRequest(shipment);
      const created = toUiShipment(response.data);
      setShipments((items) => [created, ...items]);
      setError("");
      return created;
    } catch (requestError) {
      const message = errorMessage(requestError);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateStatus = useCallback(async (trackingNumber, status, location) => {
    try {
      await updateShipmentStatus({ trackingNumber, status: status.replaceAll(" ", "_"), location, description: `Shipment status updated to ${status}` });
      await refreshShipments();
    } catch (requestError) {
      const message = errorMessage(requestError); setError(message); throw new Error(message);
    }
  }, [refreshShipments]);

  const updateShipment = useCallback(async (trackingNumber, changes) => {
    const current = shipments.find((shipment) => shipment.trackingNumber === trackingNumber);
    if (!current) return;
    try {
      const response = await updateShipmentRequest(current.shipmentId, changes);
      const updated = toUiShipment(response.data);
      setShipments((items) => items.map((item) => item.trackingNumber === trackingNumber ? updated : item));
      setError("");
    } catch (requestError) {
      const message = errorMessage(requestError); setError(message); throw new Error(message);
    }
  }, [shipments]);

  const cancelShipment = useCallback(async (trackingNumber) => {
    const current = shipments.find((shipment) => shipment.trackingNumber === trackingNumber);
    if (!current) return;
    try {
      const response = await cancelShipmentRequest(current.shipmentId);
      const cancelled = toUiShipment(response.data);
      setShipments((items) => items.map((item) => item.trackingNumber === trackingNumber ? cancelled : item));
      setError("");
    } catch (requestError) {
      const message = errorMessage(requestError); setError(message); throw new Error(message);
    }
  }, [shipments]);

  const metrics = useMemo(() => {
    const total = shipments.length;
    const active = shipments.filter((item) => !["Delivered", "Cancelled", "Returned"].includes(item.status)).length;
    return { total, active, delivered: shipments.filter((item) => item.status === "Delivered").length,
      delayed: shipments.filter((item) => item.status === "Failed Delivery").length, pendingApproval: 0,
      deliveryRate: total ? Math.round((shipments.filter((item) => item.status === "Delivered").length / total) * 100) : 0 };
  }, [shipments]);

  const value = useMemo(() => ({ shipments, loading, error, refreshShipments, createShipment, updateStatus, updateShipment, cancelShipment,
    rejectShipment: cancelShipment, metrics, statuses: Object.keys(statusProgress) }),
  [shipments, loading, error, refreshShipments, createShipment, updateStatus, updateShipment, cancelShipment, metrics]);
  return <ShipmentContext.Provider value={value}>{children}</ShipmentContext.Provider>;
}
