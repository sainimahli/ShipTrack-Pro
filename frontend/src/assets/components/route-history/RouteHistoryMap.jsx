import { useEffect, useState, useMemo, useRef } from "react";
import { loadGoogleMaps } from "../../services/mapsLoader";
import { getCoords } from "../../services/coordinates";

function statusColor(status) {
  if (!status) return "#2563eb";
  const norm = status.toLowerCase();
  if (norm.includes("delivered")) return "#10b981";
  if (norm.includes("transit")) return "#3b82f6";
  if (norm.includes("delivery") || norm.includes("out")) return "#f59e0b";
  return "#64748b";
}

/**
 * Component to display route history checkpoints on a map.
 * Supports Google Maps with a Leaflet fallback.
 */
function RouteHistoryMap({ history = [], shipment, mapId = "route-history-map" }) {
  const [mapProvider, setMapProvider] = useState("loading");
  const [googleInstance, setGoogleInstance] = useState(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // Replay State
  const [replayActive, setReplayActive] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(800);

  const leafletMapRef = useRef(null);
  const leafletReplayMarkerRef = useRef(null);
  const googleMapRef = useRef(null);
  const googleReplayMarkerRef = useRef(null);

  // Attempt Google Maps, fallback to Leaflet on timeout/error
  useEffect(() => {
    let timeoutId = setTimeout(() => {
      console.warn("Google Maps load timed out. Falling back to Leaflet.");
      setMapProvider("leaflet");
    }, 3500);

    loadGoogleMaps()
      .then((google) => {
        clearTimeout(timeoutId);
        setGoogleInstance(google);
        setMapProvider("google");
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        console.error("Google Maps failed to load, using Leaflet fallback:", err);
        setMapProvider("leaflet");
      });

    return () => clearTimeout(timeoutId);
  }, []);

  // Leaflet Resource Loader
  useEffect(() => {
    if (mapProvider !== "leaflet") return;

    const cssExists = document.getElementById("leaflet-css");
    if (!cssExists) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.id = "leaflet-css";
      document.head.appendChild(link);
    }

    const jsExists = document.getElementById("leaflet-js");
    if (!jsExists) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.id = "leaflet-js";
      script.onload = () => setLeafletReady(true);
      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          setLeafletReady(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [mapProvider]);

  // Coordinates array
  const points = useMemo(() => {
    if (history && history.length > 0) {
      return history
        .filter((h) => h.latitude != null && h.longitude != null)
        .map((h) => ({
          lat: Number(h.latitude),
          lng: Number(h.longitude),
          name: h.locationName,
          status: h.status,
          timestamp: h.timestamp,
        }));
    }

    if (shipment) {
      const senderCoords = getCoords(shipment.senderCity);
      const receiverCoords = getCoords(shipment.receiverCity);
      return [
        {
          lat: senderCoords.lat,
          lng: senderCoords.lng,
          name: `Origin: ${shipment.senderCity}`,
          status: "Created",
          timestamp: shipment.createdAt || new Date().toISOString(),
          isOrigin: true,
        },
        {
          lat: receiverCoords.lat,
          lng: receiverCoords.lng,
          name: `Destination: ${shipment.receiverCity}`,
          status: shipment.status === "Delivered" ? "Delivered" : "Awaiting Transit",
          timestamp: shipment.eta || new Date().toISOString(),
          isDestination: true,
        }
      ];
    }

    return [];
  }, [history, shipment]);

  // Render Google Map
  useEffect(() => {
    if (mapProvider !== "google" || !googleInstance || points.length === 0) return;

    const container = document.getElementById(mapId);
    if (!container) return;

    const google = googleInstance;
    const center = points[points.length - 1]; // Center on latest location

    const map = new google.maps.Map(container, {
      center: { lat: center.lat, lng: center.lng },
      zoom: 6,
      mapTypeControl: false,
      fullscreenControl: false,
    });
    googleMapRef.current = map;


    // Draw route path
    const pathCoordinates = points.map((p) => ({ lat: p.lat, lng: p.lng }));
    const routePath = new google.maps.Polyline({
      path: pathCoordinates,
      geodesic: true,
      strokeColor: "#2563eb",
      strokeOpacity: 0.8,
      strokeWeight: 4,
    });
    routePath.setMap(map);

    // Fit map bounds to points
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds);

    // Add markers
    points.forEach((p, idx) => {
      const isLatest = idx === points.length - 1;
      const isStart = idx === 0;
      const isDelivered = p.status && p.status.toLowerCase().includes("delivered");

      let markerColor = "#64748b"; // Intermediate point
      if (isStart) markerColor = "#3b82f6"; // Origin is blue
      if (isLatest) {
        markerColor = isDelivered ? "#10b981" : "#ef4444"; // Green if delivered, Red if active
      }

      // Pin shape path for the active latest position, standard circle for others
      const pinPath = isLatest 
        ? "M 0,0 C -2,-15 -8,-17 -8,-24 A 8,8 0 1,1 8,-24 C 8,-17 2,-15 0,0 z"
        : google.maps.SymbolPath.CIRCLE;

      const pinIcon = {
        path: pinPath,
        fillColor: markerColor,
        fillOpacity: 1.0,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: isLatest ? 1.4 : 7,
      };

      const marker = new google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: map,
        title: `${p.name} (${p.status})`,
        icon: pinIcon,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; padding: 4px; font-size: 13px; color: #1e293b;">
            <strong style="font-size: 14px;">📍 ${p.name}</strong><br/>
            <span style="color: #64748b; font-size: 11px;">Status: </span><strong>${p.status}</strong><br/>
            <span style="color: #64748b; font-size: 11px;">Time: </span>${new Date(p.timestamp).toLocaleString("en-IN")}
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });
  }, [mapProvider, googleInstance, points, mapId]);

  // Render Leaflet Map
  useEffect(() => {
    if (mapProvider !== "leaflet" || !leafletReady || !window.L || points.length === 0) return;

    const container = document.getElementById(mapId);
    if (!container) return;

    const L = window.L;
    const center = points[points.length - 1]; // Center on latest location

    const map = L.map(mapId, {
      zoomControl: true,
      attributionControl: false,
    }).setView([center.lat, center.lng], 6);
    leafletMapRef.current = map;


    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Draw route path line
    const latlngs = points.map((p) => [p.lat, p.lng]);
    const polyline = L.polyline(latlngs, {
      color: "#2563eb",
      weight: 4,
      opacity: 0.8,
    }).addTo(map);

    // Fit map bounds to points
    map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

    // Markers
    points.forEach((p, idx) => {
      const isLatest = idx === points.length - 1;
      const isStart = idx === 0;
      const isDelivered = p.status && p.status.toLowerCase().includes("delivered");

      let markerColor = "#64748b";
      if (isStart) markerColor = "#3b82f6";
      if (isLatest) {
        markerColor = isDelivered ? "#10b981" : "#ef4444";
      }

      const iconHtml = isLatest
        ? `<div class="pulsating-marker" style="
            width: 16px; 
            height: 16px; 
            border-radius: 50%; 
            background: ${markerColor}; 
            border: 3px solid white; 
            box-shadow: 0 0 0 6px ${markerColor === "#10b981" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"};
           "></div>`
        : `<div style="
            width: 12px; 
            height: 12px; 
            border-radius: 50%; 
            background: ${markerColor}; 
            border: 2px solid white; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
           "></div>`;

      const customIcon = L.divIcon({
        className: "custom-route-marker",
        html: iconHtml,
        iconSize: isLatest ? [16, 16] : [12, 12],
        iconAnchor: isLatest ? [8, 8] : [6, 6],
      });

      const marker = L.marker([p.lat, p.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #1e293b;">
          <strong>📍 ${p.name}</strong><br/>
          <b>Status:</b> ${p.status}<br/>
          <b>Time:</b> ${new Date(p.timestamp).toLocaleString("en-IN")}
        </div>
      `);
    });

    return () => {
      leafletMapRef.current = null;
      if (leafletReplayMarkerRef.current) {
        leafletReplayMarkerRef.current.remove();
        leafletReplayMarkerRef.current = null;
      }
      map.remove();
    };
  }, [mapProvider, leafletReady, points, mapId]);

  // Replay timer loop
  useEffect(() => {
    if (!replayActive || points.length === 0) return;

    const interval = setInterval(() => {
      setReplayIndex((prevIndex) => {
        if (prevIndex >= points.length - 1) {
          setReplayActive(false);
          return prevIndex;
        }
        return prevIndex + 1;
      });
    }, replaySpeed);

    return () => clearInterval(interval);
  }, [replayActive, points.length, replaySpeed]);

  // Update Leaflet Replay Marker
  useEffect(() => {
    if (mapProvider !== "leaflet" || !leafletMapRef.current || !window.L || points.length === 0) return;
    const L = window.L;

    if (leafletReplayMarkerRef.current) {
      leafletReplayMarkerRef.current.remove();
      leafletReplayMarkerRef.current = null;
    }

    if (replayActive || replayIndex > 0) {
      const activePoint = points[replayIndex];
      if (activePoint) {
        const iconHtml = `<div class="replay-truck-marker" style="
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          background: #ea580c; 
          border: 2px solid white; 
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          animation: pulse-marker 1.5s infinite;
         ">🚚</div>`;

        const customIcon = L.divIcon({
          className: "custom-replay-marker",
          html: iconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([activePoint.lat, activePoint.lng], { icon: customIcon }).addTo(leafletMapRef.current);
        marker.bindPopup(`<strong>Replay Point</strong><br/>📍 ${activePoint.name}<br/>Status: ${activePoint.status}`).openPopup();
        leafletReplayMarkerRef.current = marker;

        leafletMapRef.current.panTo([activePoint.lat, activePoint.lng]);
      }
    }
  }, [replayIndex, replayActive, points, mapProvider]);

  // Update Google Replay Marker
  useEffect(() => {
    if (mapProvider !== "google" || !googleMapRef.current || !googleInstance || points.length === 0) return;
    const google = googleInstance;

    if (googleReplayMarkerRef.current) {
      googleReplayMarkerRef.current.setMap(null);
      googleReplayMarkerRef.current = null;
    }

    if (replayActive || replayIndex > 0) {
      const activePoint = points[replayIndex];
      if (activePoint) {
        const marker = new google.maps.Marker({
          position: { lat: activePoint.lat, lng: activePoint.lng },
          map: googleMapRef.current,
          title: `Replaying: ${activePoint.name}`,
          icon: {
            path: "M0-48c-9.8 0-17.7 7.8-17.7 17.5 0 14.7 17.7 30.5 17.7 30.5s17.7-15.8 17.7-30.5c0-9.7-7.9-17.5-17.7-17.5z",
            fillColor: "#ea580c",
            fillOpacity: 1.0,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 0.6,
          }
        });
        googleReplayMarkerRef.current = marker;
        googleMapRef.current.panTo({ lat: activePoint.lat, lng: activePoint.lng });
      }
    }
  }, [replayIndex, replayActive, points, mapProvider, googleInstance]);


  if (points.length === 0) {
    return (
      <div className="panel" style={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
        No coordinates available to map.
      </div>
    );
  }

  return (
    <div className="panel" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 className="section-title" style={{ margin: 0 }}>Route Path Map</h3>
        {points.length > 1 && (
          <button 
            type="button"
            className="button secondary compact" 
            onClick={() => {
              if (replayActive) {
                setReplayActive(false);
              } else {
                if (replayIndex >= points.length - 1) setReplayIndex(0);
                setReplayActive(true);
              }
            }}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <span>{replayActive ? "⏸ Pause Replay" : "▶ Play Replay"}</span>
          </button>
        )}
      </div>

      <div style={{ position: "relative", width: "100%", height: 400 }}>
        <div
          id={mapId}
          style={{ width: "100%", height: "100%", borderRadius: 12, border: "1px solid #e2e8f0" }}
        />
        {mapProvider === "loading" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 12 }}>
            <p className="subtle">Loading map view...</p>
          </div>
        )}
      </div>

      {points.length > 1 && (
        <div style={{ marginTop: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569", minWidth: "100px" }}>
              Replay Timeline:
            </span>
            <input 
              type="range" 
              min="0" 
              max={points.length - 1} 
              value={replayIndex} 
              onChange={(e) => {
                setReplayIndex(Number(e.target.value));
                setReplayActive(false);
              }}
              style={{ flex: 1, cursor: "pointer" }}
            />
            <span style={{ fontSize: "12px", color: "#64748b", minWidth: "40px", textAlign: "right" }}>
              {replayIndex + 1} / {points.length}
            </span>
            <select 
              value={replaySpeed} 
              onChange={(e) => setReplaySpeed(Number(e.target.value))}
              style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #cbd5e1", outline: "none", cursor: "pointer" }}
            >
              <option value={1500}>0.5x Speed</option>
              <option value={800}>1x Speed</option>
              <option value={400}>2x Speed</option>
              <option value={200}>5x Speed</option>
            </select>
          </div>
          {(replayActive || replayIndex > 0) && points[replayIndex] && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#ea580c", fontWeight: "600", textAlign: "center" }}>
              🚚 Replaying location: <strong style={{ color: "#c2410c" }}>{points[replayIndex].name}</strong> ({points[replayIndex].status})
            </div>
          )}
        </div>
      )}
    </div>
  );

}

export default RouteHistoryMap;
