import { useCallback, useEffect, useMemo, useState } from "react";
import { ShipmentContext } from "./shipments";

const STORAGE_KEY = "shiptrack_shipments";

const initialShipments = [
  {
    id: "SHP-2026-001",
    trackingNumber: "STP10024591",
    senderName: "Apex Retail Pvt Ltd",
    senderCity: "Mumbai",
    receiverName: "NorthMart Warehouse",
    receiverCity: "Delhi",
    packageType: "Electronics",
    weight: "18.5 kg",
    deliveryAddress: "Plot 42, Okhla Industrial Estate, New Delhi",
    status: "In Transit",
    eta: "2026-07-05",
    priority: "Express",
    createdAt: "2026-07-01",
    progress: 58,
    assignedTo: "Logistics Operator",
    history: [
      {
        status: "Created",
        location: "Mumbai Fulfillment Hub",
        timestamp: "2026-07-01T09:30:00",
      },
      {
        status: "Picked Up",
        location: "Andheri East, Mumbai",
        timestamp: "2026-07-01T14:20:00",
      },
      {
        status: "In Transit",
        location: "Nagpur Linehaul Center",
        timestamp: "2026-07-02T22:40:00",
      },
    ],
  },
  {
    id: "SHP-2026-002",
    trackingNumber: "STP10024592",
    senderName: "Urban Furnishings",
    senderCity: "Bengaluru",
    receiverName: "HomeLane Studio",
    receiverCity: "Hyderabad",
    packageType: "Furniture",
    weight: "42 kg",
    deliveryAddress: "Road 12, Banjara Hills, Hyderabad",
    status: "Out for Delivery",
    eta: "2026-07-03",
    priority: "Standard",
    createdAt: "2026-06-30",
    progress: 84,
    assignedTo: "Logistics Operator",
    history: [
      {
        status: "Created",
        location: "Bengaluru Warehouse",
        timestamp: "2026-06-30T11:00:00",
      },
      {
        status: "Picked Up",
        location: "Peenya, Bengaluru",
        timestamp: "2026-06-30T15:00:00",
      },
      {
        status: "In Transit",
        location: "Kurnool Transit Hub",
        timestamp: "2026-07-02T06:20:00",
      },
      {
        status: "Out for Delivery",
        location: "Hyderabad Last-Mile Center",
        timestamp: "2026-07-03T08:45:00",
      },
    ],
  },
  {
    id: "SHP-2026-003",
    trackingNumber: "STP10024593",
    senderName: "MedCare Supplies",
    senderCity: "Pune",
    receiverName: "City Clinic",
    receiverCity: "Chennai",
    packageType: "Medical Supplies",
    weight: "7.2 kg",
    deliveryAddress: "Mount Road, Chennai",
    status: "Delivered",
    eta: "2026-07-02",
    priority: "Critical",
    createdAt: "2026-06-29",
    progress: 100,
    assignedTo: "Logistics Operator",
    history: [
      {
        status: "Created",
        location: "Pune Distribution Center",
        timestamp: "2026-06-29T10:10:00",
      },
      {
        status: "Picked Up",
        location: "Hinjewadi, Pune",
        timestamp: "2026-06-29T13:30:00",
      },
      {
        status: "In Transit",
        location: "Bengaluru Transit Hub",
        timestamp: "2026-07-01T03:00:00",
      },
      {
        status: "Delivered",
        location: "City Clinic, Chennai",
        timestamp: "2026-07-02T16:35:00",
      },
    ],
  },
];

const statusProgress = {
  "Pending Approval": 0,
  Created: 12,
  "Picked Up": 28,
  "In Transit": 58,
  "Out for Delivery": 84,
  Delivered: 100,
  "Failed Delivery": 72,
  Rejected: 0,
  Cancelled: 0,
};

const getStoredShipments = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialShipments;
  } catch {
    return initialShipments;
  }
};

export function ShipmentProvider({ children }) {
  const [shipments, setShipments] = useState(getStoredShipments);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
  }, [shipments]);

  const createShipment = useCallback(
    (shipment) => {
      const nextNumber = shipments.length + 1;
      const created = {
        ...shipment,
        id: `SHP-2026-${String(nextNumber + 3).padStart(3, "0")}`,
        trackingNumber: `STP${String(10024593 + nextNumber).padStart(8, "0")}`,
        status: shipment.requestStatus || "Created",
        createdAt: new Date().toISOString().slice(0, 10),
        progress: statusProgress[shipment.requestStatus] ?? statusProgress.Created,
        history: [
          {
            status: shipment.requestStatus || "Created",
            location: shipment.senderCity,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      setShipments((items) => [created, ...items]);
      return created;
    },
    [shipments.length],
  );

  const updateStatus = useCallback((trackingNumber, status, location) => {
    setShipments((items) =>
      items.map((shipment) => {
        if (shipment.trackingNumber !== trackingNumber) return shipment;

        return {
          ...shipment,
          status,
          progress: statusProgress[status] ?? shipment.progress,
          history: [
            ...shipment.history,
            {
              status,
              location: location || shipment.receiverCity,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }),
    );
  }, []);

  const updateShipment = useCallback((trackingNumber, changes) => {
    setShipments((items) =>
      items.map((shipment) =>
        shipment.trackingNumber === trackingNumber
          ? { ...shipment, ...changes }
          : shipment,
      ),
    );
  }, []);

  const cancelShipment = useCallback((trackingNumber, location) => {
    setShipments((items) =>
      items.map((shipment) => {
        if (shipment.trackingNumber !== trackingNumber || shipment.status === "Cancelled") {
          return shipment;
        }

        return {
          ...shipment,
          status: "Cancelled",
          progress: statusProgress.Cancelled,
          history: [
            ...shipment.history,
            {
              status: "Cancelled",
              location: location || shipment.senderCity,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }),
    );
  }, []);

  const rejectShipment = useCallback((trackingNumber, location) => {
    setShipments((items) =>
      items.map((shipment) => {
        if (shipment.trackingNumber !== trackingNumber || shipment.status !== "Pending Approval") {
          return shipment;
        }

        return {
          ...shipment,
          status: "Rejected",
          progress: statusProgress.Rejected,
          history: [
            ...shipment.history,
            {
              status: "Rejected",
              location: location || shipment.senderCity,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }),
    );
  }, []);

  const metrics = useMemo(() => {
    const total = shipments.length;
    const active = shipments.filter(
      (shipment) => !["Delivered", "Cancelled", "Rejected", "Pending Approval"].includes(shipment.status),
    ).length;
    const delivered = shipments.filter((shipment) => shipment.status === "Delivered").length;
    const delayed = shipments.filter((shipment) => shipment.status === "Failed Delivery").length;
    const pendingApproval = shipments.filter((shipment) => shipment.status === "Pending Approval").length;

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
      createShipment,
      updateStatus,
      updateShipment,
      cancelShipment,
      rejectShipment,
      metrics,
      statuses: Object.keys(statusProgress),
    }),
    [cancelShipment, createShipment, metrics, rejectShipment, shipments, updateShipment, updateStatus],
  );

  return <ShipmentContext.Provider value={value}>{children}</ShipmentContext.Provider>;
}
