import { useCallback,useEffect, useMemo, useState } from "react";
import { ShipmentContext } from "./shipments";
import {
  getShipments as apiGetShipments,
  createShipment as apiCreateShipment,
  updateShipment as apiUpdateShipment,
  cancelShipment as apiCancelShipment,
  updateTrackingStatus as apiUpdateTrackingStatus,
  getTrackingTimeline as apiGetTrackingTimeline,
  getDeliveryConfirmation as apiGetDeliveryConfirmation,
} from "../services/api";

// ---------------------------------------------------------------------------
// Status progress mapping (UI only — no longer drives backend state)
// ---------------------------------------------------------------------------
const statusProgress = {
  "Pending Approval": 0,
  CREATED: 12,
  Created: 12,
  PICKED_UP: 28,
  "Picked Up": 28,
  IN_TRANSIT: 58,
  "In Transit": 58,
  OUT_FOR_DELIVERY: 84,
  "Out for Delivery": 84,
  DELIVERED: 100,
  Delivered: 100,
  FAILED_DELIVERY: 72,
  "Failed Delivery": 72,
  Rejected: 0,
  CANCELLED: 0,
  Cancelled: 0,
  RETURNED: 0,
  Returned: 0,
};

const statusLabels = {
  CREATED: "Created",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED_DELIVERY: "Failed Delivery",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

// ---------------------------------------------------------------------------
// Map a backend ShipmentResponse → the shape the existing UI components read
// ---------------------------------------------------------------------------
function mapBackendShipment(s) {
  // Normalise enum-style status strings like "IN_TRANSIT" → "In Transit"
  const status = statusLabels[s.shipmentStatus] ?? s.shipmentStatus ?? "Created";

  return {
    // --- identity ---
    id: String(s.shipmentId),
    trackingNumber: s.trackingNumber,
    shipmentId: s.shipmentId,
    userId: s.userId,

    // --- UI display fields (backend doesn't store free-text names/cities) ---
    // These are populated from the backend where available, otherwise blank.
    senderName: s.senderName ?? "",
    senderCity: s.senderCity ?? "",
    receiverName: s.receiverName ?? "",
    receiverCity: s.receiverCity ?? "",
    packageType: s.packageType ?? s.shipmentType ?? "General Cargo",
    weight: s.weight ?? (s.totalWeightKg != null ? `${s.totalWeightKg} kg` : ""),
    deliveryAddress: s.deliveryAddress ?? "",
    priority: s.priority ?? "Standard",

    // --- lifecycle ---
    status,
    eta: s.expectedDeliveryDate ?? "",
    createdAt: s.createdAt ? s.createdAt.slice(0, 10) : "",
    progress: statusProgress[status] ?? 0,
    assignedTo: "Logistics Operator",

    // --- history (tracking events not loaded here — empty default) ---
    history: s.history ?? [
      {
        status,
        location: "",
        timestamp: s.createdAt ?? null,
      },
    ],

    // --- raw backend fields (for future use) ---
    senderAddressId: s.senderAddressId,
    receiverAddressId: s.receiverAddressId,
    originWarehouseId: s.originWarehouseId,
    destinationWarehouseId: s.destinationWarehouseId,
    assignedDriverId: s.assignedDriverId,
    assignedVehicleId: s.assignedVehicleId,
    totalWeightKg: s.totalWeightKg,
    shipmentType: s.shipmentType,
    expectedDeliveryDate: s.expectedDeliveryDate,
    isDelayed: s.isDelayed,
    delayReason: s.delayReason,
    distanceRemainingKm: s.distanceRemainingKm,
    currentLatitude: s.currentLatitude ?? null,
    currentLongitude: s.currentLongitude ?? null,
  };
}

function mapTrackingEvent(event) {
  return {
    status: statusLabels[event.status] ?? event.status ?? "Created",
    location: event.locationName ?? "Location update pending",
    timestamp: event.updatedAt ?? new Date().toISOString(),
  };
}

export function ShipmentProvider({ children }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // -------------------------------------------------------------------------
  // Load all shipments from the backend on mount
  // -------------------------------------------------------------------------
  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetShipments();
      const mappedShipments = await Promise.all((res.data ?? []).map(async (shipment) => {
        const mapped = mapBackendShipment(shipment);
        try {
          const timeline = await apiGetTrackingTimeline(shipment.trackingNumber);
          const history = (timeline.data?.events ?? []).map(mapTrackingEvent);
          return history.length ? { ...mapped, history } : mapped;
        } catch {
          return mapped;
        }
      }));
      setShipments(mappedShipments);
      console.log("Fetched shipments:", mappedShipments);
    } catch (err) {
      console.error("Failed to load shipments:", err);
      setError("Could not load shipments from server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoadTimer = window.setTimeout(() => {
      fetchShipments();
    }, 0);

    const refreshTimer = window.setInterval(fetchShipments, 30_000);

    return () => {
      window.clearTimeout(initialLoadTimer);
      window.clearInterval(refreshTimer);
    };
  }, [fetchShipments]);

  // -------------------------------------------------------------------------
  // Create shipment — POST to backend, then re-fetch the list
  // -------------------------------------------------------------------------
  const createShipment = useCallback(
    async (formData) => {
      const numericWeight = Number.parseFloat(String(formData.weight).trim());
      if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
        throw new Error("Package weight must be a number greater than zero.");
      }

      // The existing backend creates the address records from city/address
      // details when IDs are omitted, so users never need to enter database IDs.
      const payload = {
        senderName: formData.senderName.trim(),
        senderCity: formData.senderCity.trim(),
        receiverName: formData.receiverName.trim(),
        receiverCity: formData.receiverCity.trim(),
        deliveryAddress: formData.deliveryAddress.trim(),
        weight: String(numericWeight),
        priority: formData.priority,
        eta: formData.eta,
        totalWeightKg: numericWeight,
        shipmentType: formData.shipmentType,
        packageType: formData.packageType,
        expectedDeliveryDate: formData.eta,
      };

      const res = await apiCreateShipment(payload);
      const created = mapBackendShipment(res.data);

      // Re-fetch list so the table shows the persisted record
      await fetchShipments();

      return created;
    },
    [fetchShipments],
  );


  const getDeliveryConfirmation = useCallback(async (shipmentId) => {
    const res = await apiGetDeliveryConfirmation(shipmentId);
    return res.data;
  }, []);
  const updateStatus = useCallback(async (trackingNumber, status, location) => {
    await apiUpdateTrackingStatus({
      trackingNumber,
      status: status.toUpperCase().replaceAll(" ", "_"),
      description: location ? `Status updated at ${location}` : `Status updated to ${status}`,
      locationName: location || undefined,
    });
    await fetchShipments();
  }, [fetchShipments]);

  const updateShipment = useCallback(async (trackingNumber, changes) => {
    const shipment = shipments.find((item) => item.trackingNumber === trackingNumber);
    if (!shipment) throw new Error("Shipment not found");

    await apiUpdateShipment(shipment.shipmentId, {
      senderAddressId: shipment.senderAddressId,
      receiverAddressId: shipment.receiverAddressId,
      senderName: changes.senderName ?? shipment.senderName,
      senderCity: changes.senderCity ?? shipment.senderCity,
      receiverName: changes.receiverName ?? shipment.receiverName,
      receiverCity: changes.receiverCity ?? shipment.receiverCity,
      deliveryAddress: changes.deliveryAddress ?? shipment.deliveryAddress,
      originWarehouseId: shipment.originWarehouseId,
      destinationWarehouseId: shipment.destinationWarehouseId,
      assignedDriverId: shipment.assignedDriverId,
      assignedVehicleId: shipment.assignedVehicleId,
      shipmentType: changes.shipmentType ?? shipment.shipmentType ?? "STANDARD",
      packageType: changes.packageType ?? shipment.packageType ?? "General Cargo",
      totalWeightKg: Number.parseFloat(String(changes.weight ?? shipment.totalWeightKg ?? shipment.weight).replace(/[^0-9.]/g, "")) || null,
      weight: String(changes.weight ?? shipment.weight ?? ""),
      priority: changes.priority ?? shipment.priority,
      eta: changes.eta ?? shipment.eta ?? null,
      expectedDeliveryDate: changes.eta || shipment.expectedDeliveryDate || null,
    });
    await fetchShipments();
  }, [fetchShipments, shipments]);

  const cancelShipment = useCallback(async (trackingNumber) => {
    const shipment = shipments.find((item) => item.trackingNumber === trackingNumber);
    if (!shipment?.shipmentId) throw new Error("Shipment not found");
    await apiCancelShipment(shipment.shipmentId);
    await fetchShipments();
  }, [fetchShipments, shipments]);

  const rejectShipment = useCallback(() => {
    throw new Error("BACKEND LIMITATION — no supported shipment-rejection API is available.");
  }, []);

  // -------------------------------------------------------------------------
  // Metrics
  // -------------------------------------------------------------------------
  const metrics = useMemo(() => {
    const total = shipments.length;
    const active = shipments.filter(
      (s) =>
        !["Delivered", "Cancelled", "Rejected", "Pending Approval"].includes(
          s.status,
        ),
    ).length;
    const delivered = shipments.filter((s) => s.status === "Delivered").length;
    const delayed = shipments.filter(
      (s) => s.status === "Failed Delivery",
    ).length;
    const pendingApproval = shipments.filter(
      (s) => s.status === "Pending Approval",
    ).length;
    return {
      total,
      active,
      delivered,
      delayed,
      pendingApproval,
      deliveryRate: total ? Math.round((delivered / total) * 100) : 0,
    };
  }, [shipments]);

  const value = useMemo(
      () => ({
        shipments,
        loading,
        error,
        createShipment,
        getDeliveryConfirmation,
        updateStatus,
        updateShipment,
        cancelShipment,
        rejectShipment,
        metrics,
        statuses: Object.keys(statusProgress).filter(
            (k) => !k.includes("_"), // expose only human-readable keys
        ),
        refetch: fetchShipments,
      }),
      [
        cancelShipment,
        createShipment,
        getDeliveryConfirmation,
        error,
        fetchShipments,
        loading,
        metrics,
        rejectShipment,
        shipments,
        updateShipment,
        updateStatus,
      ],
  );
  return (
      <ShipmentContext.Provider value={value}>
        {children}
      </ShipmentContext.Provider>
  );
}
