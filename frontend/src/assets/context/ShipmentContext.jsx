import { useCallback, useEffect, useMemo, useState, useContext } from "react";
import { ShipmentContext } from "./shipments";
import { AuthContext } from "./auth";
import API from "../services/api";
import { getCoords } from "../services/coordinates";



const statusMapFrontendToBackend = {
  "Pending Approval": "CREATED",
  "Created": "CREATED",
  "Picked Up": "PICKED_UP",
  "In Transit": "IN_TRANSIT",
  "Out for Delivery": "OUT_FOR_DELIVERY",
  "Delivered": "DELIVERED",
  "Failed Delivery": "CANCELLED",
  "Cancelled": "CANCELLED",
  "Rejected": "CANCELLED",
};

const mapStatusToFrontend = (backendStatus) => {
  return backendStatus === "CREATED" ? "Created" :
         backendStatus === "PICKED_UP" ? "Picked Up" :
         backendStatus === "IN_TRANSIT" ? "In Transit" :
         backendStatus === "OUT_FOR_DELIVERY" ? "Out for Delivery" :
         backendStatus === "DELIVERED" ? "Delivered" :
         backendStatus === "FAILED_DELIVERY" ? "Failed Delivery" :
         backendStatus === "CANCELLED" ? "Cancelled" :
         backendStatus === "REJECTED" ? "Rejected" : "Created";
};

const driversList = [
  "Ramesh Pawar",
  "Suresh Kumar",
  "Amit Verma",
  "Vijay Singh",
  "Rajesh Patel",
  "Priya Singh",
  "Karan Johar",
  "Sunita Williams"
];

const vehiclesList = [
  "MH-12-AB-2018",
  "DL-01-XY-5678",
  "KA-03-MN-9012",
  "TN-07-PQ-3456",
  "HR-26-Z-7890",
  "UP-32-AB-1234",
  "MH-02-CD-5678"
];

function getStableIndex(trackingNumber, arrayLength) {
  let hash = 0;
  for (let i = 0; i < trackingNumber.length; i++) {
    hash = trackingNumber.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % arrayLength;
}

function getDynamicVehicleAndTraffic(trackingNumber, status) {
  const isMoving = ["Picked Up", "In Transit", "Out for Delivery"].includes(status);
  
  if (!isMoving) {
    return {
      vehicle: {
        name: status === "Delivered" ? vehiclesList[getStableIndex(trackingNumber, vehiclesList.length)] : "Awaiting assignment",
        driver: status === "Delivered" ? driversList[getStableIndex(trackingNumber, driversList.length)] : "Awaiting assignment",
        speedKmph: 0,
        heading: 0
      },
      traffic: {
        severity: "Low",
        delayMinutes: 0
      }
    };
  }

  const driverIndex = getStableIndex(trackingNumber, driversList.length);
  const vehicleIndex = getStableIndex(trackingNumber, vehiclesList.length);
  
  let speed = 50;
  let heading = getStableIndex(trackingNumber, 360);
  let severity = "Low";
  let delay = getStableIndex(trackingNumber, 15);

  if (status === "Picked Up") {
    speed = 40 + (getStableIndex(trackingNumber, 15));
    severity = getStableIndex(trackingNumber, 2) === 0 ? "Low" : "Moderate";
    delay = getStableIndex(trackingNumber, 10);
  } else if (status === "In Transit") {
    speed = 55 + (getStableIndex(trackingNumber, 25));
    severity = getStableIndex(trackingNumber, 3) === 0 ? "Low" : (getStableIndex(trackingNumber, 3) === 1 ? "Moderate" : "Heavy");
    delay = 10 + getStableIndex(trackingNumber, 30);
  } else if (status === "Out for Delivery") {
    speed = 15 + (getStableIndex(trackingNumber, 15));
    severity = getStableIndex(trackingNumber, 2) === 0 ? "Moderate" : "Heavy";
    delay = 5 + getStableIndex(trackingNumber, 20);
  }

  return {
    vehicle: {
      name: vehiclesList[vehicleIndex],
      driver: driversList[driverIndex],
      speedKmph: speed,
      heading: heading
    },
    traffic: {
      severity: severity,
      delayMinutes: delay
    }
  };
}

const mapBackendToFrontend = async (item) => {
  let history = [];
  try {
    const res = await API.get(`/tracking/timeline/${encodeURIComponent(item.trackingNumber)}`);
    if (res.data && res.data.events) {
      history = res.data.events.map(event => ({
        status: mapStatusToFrontend(event.status),
        location: event.locationName || item.originAddress?.city || "Unknown",
        timestamp: event.updatedAt || new Date().toISOString(),
        latitude: event.latitude,
        longitude: event.longitude,
        description: event.description
      }));
    }
  } catch (err) {
    history = [{
      status: mapStatusToFrontend(item.shipmentStatus),
      location: item.originAddress?.city || "Origin Hub",
      timestamp: item.createdAt || new Date().toISOString(),
    }];
  }

  const progressMap = {
    "Pending Approval": 0,
    "Created": 12,
    "Picked Up": 28,
    "In Transit": 58,
    "Out for Delivery": 84,
    "Delivered": 100,
    "Failed Delivery": 72,
    "Rejected": 0,
    "Cancelled": 0,
  };

  const statusStr = mapStatusToFrontend(item.shipmentStatus);
  const progressVal = progressMap[statusStr] ?? 12;
  const dynamicDetails = getDynamicVehicleAndTraffic(item.trackingNumber, statusStr);

  return {
    id: item.id,
    trackingNumber: item.trackingNumber,
    senderName: item.senderName,
    senderCity: item.originAddress?.city || "Unknown",
    receiverName: item.receiverName,
    receiverCity: item.destinationAddress?.city || "Unknown",
    packageType: item.packageType || "General Cargo",
    weight: `${item.packageWeight} kg`,
    deliveryAddress: `${item.destinationAddress?.line1 || ""}, ${item.destinationAddress?.line2 || ""}, ${item.destinationAddress?.city || ""}`.trim().replace(/^,\s*|,\s*$/g, ""),
    status: statusStr,
    eta: (item.expectedDeliveryDate && typeof item.expectedDeliveryDate === "string") 
      ? item.expectedDeliveryDate.substring(0, 10) 
      : (Array.isArray(item.expectedDeliveryDate) 
         ? `${item.expectedDeliveryDate[0]}-${String(item.expectedDeliveryDate[1]).padStart(2, '0')}-${String(item.expectedDeliveryDate[2]).padStart(2, '0')}`
         : ""),
    priority: item.shipmentType || "Standard",
    createdAt: (item.createdAt && typeof item.createdAt === "string") 
      ? item.createdAt.substring(0, 10) 
      : (Array.isArray(item.createdAt) 
         ? `${item.createdAt[0]}-${String(item.createdAt[1]).padStart(2, '0')}-${String(item.createdAt[2]).padStart(2, '0')}`
         : new Date().toISOString().substring(0, 10)),
    progress: progressVal,
    assignedTo: "Logistics Operator",
    history: history,
    vehicle: dynamicDetails.vehicle,
    traffic: dynamicDetails.traffic
  };
};

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

export function ShipmentProvider({ children }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { auth } = useContext(AuthContext);

  const fetchShipments = useCallback(async () => {
    if (!auth?.token) {
      setShipments([]);
      return;
    }
    setLoading(true);
    try {
      const response = await API.get("/shipments");
      const list = response.data || [];
      const mapped = await Promise.all(list.map(mapBackendToFrontend));
      mapped.sort((a, b) => b.id - a.id);
      setShipments(mapped);
    } catch (error) {
      console.error("Failed to fetch shipments:", error);
    } finally {
      setLoading(false);
    }
  }, [auth?.token]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const createShipment = useCallback(
    async (shipmentData) => {
      try {
        const payload = {
          senderName: shipmentData.senderName,
          senderPhone: "9999999999",
          senderUserId: null,
          receiverName: shipmentData.receiverName,
          receiverPhone: "9999999999",
          receiverUserId: null,
          originAddress: {
            line1: "Origin Address Line 1",
            line2: "",
            city: shipmentData.senderCity,
            state: "",
            postalCode: "111111",
            country: "India"
          },
          destinationAddress: {
            line1: shipmentData.deliveryAddress || "Destination Address Line 1",
            line2: "",
            city: shipmentData.receiverCity,
            state: "",
            postalCode: "222222",
            country: "India"
          },
          packageWeight: parseFloat(shipmentData.weight) || 1.0,
          shipmentType: shipmentData.priority || "Standard",
          packageType: shipmentData.packageType || "General Cargo",
          expectedDeliveryDate: shipmentData.eta ? `${shipmentData.eta}T18:00:00` : null
        };

        const response = await API.post("/shipments", payload);
        const createdItem = response.data;

        await fetchShipments();

        const mapped = await mapBackendToFrontend(createdItem);
        return mapped;
      } catch (error) {
        console.error("Failed to create shipment:", error);
        throw error;
      }
    },
    [fetchShipments]
  );

  const updateStatus = useCallback(async (trackingNumber, status, location) => {
    try {
      const backendStatus = statusMapFrontendToBackend[status] || "CREATED";
      
      await API.put("/tracking/status", {
        trackingNumber,
        status: backendStatus,
        description: `Status updated to ${status}`
      });

      if (location) {
        await API.post("/tracking/location", {
          trackingNumber,
          locationName: location,
          description: `Location checkpoint: ${location}`,
          latitude: getCoords(location).lat,
          longitude: getCoords(location).lng
        });
      }

      await fetchShipments();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }, [fetchShipments]);

  const updateShipment = useCallback(async (trackingNumber, changes) => {
    try {
      const existing = shipments.find(s => s.trackingNumber === trackingNumber);
      if (!existing) return;

      const payload = {
        senderName: changes.senderName || existing.senderName,
        senderPhone: "9999999999",
        senderUserId: null,
        receiverName: changes.receiverName || existing.receiverName,
        receiverPhone: "9999999999",
        receiverUserId: null,
        packageWeight: changes.weight ? parseFloat(changes.weight) : parseFloat(existing.weight),
        shipmentType: changes.priority || existing.priority,
        packageType: changes.packageType || existing.packageType,
        expectedDeliveryDate: changes.eta ? `${changes.eta}T18:00:00` : `${existing.eta}T18:00:00`,
        originAddress: {
          line1: "Origin Address Line 1",
          line2: "",
          city: changes.senderCity || existing.senderCity,
          state: "",
          postalCode: "111111",
          country: "India"
        },
        destinationAddress: {
          line1: changes.deliveryAddress || existing.deliveryAddress || "Destination Address Line 1",
          line2: "",
          city: changes.receiverCity || existing.receiverCity,
          state: "",
          postalCode: "222222",
          country: "India"
        }
      };

      await API.put(`/shipments/${existing.id}`, payload);
      
      if (changes.status && changes.status !== existing.status) {
        const backendStatus = statusMapFrontendToBackend[changes.status] || "CREATED";
        await API.put("/tracking/status", {
          trackingNumber,
          status: backendStatus,
          description: `Status updated to ${changes.status}`
        });
      }

      await fetchShipments();
    } catch (error) {
      console.error("Failed to update shipment:", error);
    }
  }, [shipments, fetchShipments]);

  const cancelShipment = useCallback(async (trackingNumber, location) => {
    try {
      await API.put("/tracking/status", {
        trackingNumber,
        status: "CANCELLED",
        description: "Shipment Cancelled"
      });

      if (location) {
        await API.post("/tracking/location", {
          trackingNumber,
          locationName: location,
          description: "Cancelled at location",
          latitude: getCoords(location).lat,
          longitude: getCoords(location).lng
        });
      }

      await fetchShipments();
    } catch (error) {
      console.error("Failed to cancel shipment:", error);
    }
  }, [fetchShipments]);

  const rejectShipment = useCallback(async (trackingNumber, location) => {
    try {
      await API.put("/tracking/status", {
        trackingNumber,
        status: "CANCELLED",
        description: "Request Rejected"
      });

      if (location) {
        await API.post("/tracking/location", {
          trackingNumber,
          locationName: location,
          description: "Rejected at location",
          latitude: getCoords(location).lat,
          longitude: getCoords(location).lng
        });
      }

      await fetchShipments();
    } catch (error) {
      console.error("Failed to reject shipment:", error);
    }
  }, [fetchShipments]);

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
      loading,
      fetchShipments,
      createShipment,
      updateStatus,
      updateShipment,
      cancelShipment,
      rejectShipment,
      metrics,
      statuses: Object.keys(statusProgress),
    }),
    [cancelShipment, createShipment, fetchShipments, metrics, rejectShipment, shipments, loading, updateShipment, updateStatus],
  );

  return <ShipmentContext.Provider value={value}>{children}</ShipmentContext.Provider>;
}
