import { useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const sourceIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const destIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='25' height='41' viewBox='0 0 25 41'><path d='M12.5 0C5.6 0 0 5.6 0 12.5 0 22 12.5 41 12.5 41S25 22 25 12.5C25 5.6 19.4 0 12.5 0z' fill='#c2410c'/><circle cx='12.5' cy='12.5' r='5' fill='#fff'/></svg>`
    ),
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function FitBounds({ bounds }) {
  const map = useMap();
  if (bounds) map.fitBounds(bounds, { padding: [40, 40] });
  return null;
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.length) throw new Error(`No results for "${query}"`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), label: data[0].display_name };
}

async function fetchRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Routing failed");
  const data = await res.json();
  if (!data.routes?.length) throw new Error("No route found");
  const r = data.routes[0];
  return {
    coords: r.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    distanceKm: r.distance / 1000,
    durationMin: r.duration / 60,
  };
}

function RouteManagement() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const mapRef = useRef(null);

  const initialCenter = [20.5937, 78.9629];

  const bounds = useMemo(() => {
    if (!result) return null;
    return [[result.from.lat, result.from.lon], [result.to.lat, result.to.lon]];
  }, [result]);

  const onPlan = async (e) => {
    e.preventDefault();
    setError(""); setResult(null);
    if (!source.trim() || !destination.trim()) {
      setError("Please enter both source and destination."); return;
    }
    setLoading(true);
    try {
      const [from, to] = await Promise.all([geocode(source), geocode(destination)]);
      const route = await fetchRoute(from, to);
      setResult({ from, to, ...route });
    } catch (err) {
      setError(err.message || "Something went wrong planning the route.");
    } finally { setLoading(false); }
  };

  const onClear = () => { setSource(""); setDestination(""); setResult(null); setError(""); };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Route Management</div>
          <h1>Route Management</h1>
          <div className="subtle">Enter a source and destination to visualize the optimal driving route on the map.</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <h3 className="section-title">Plan a route</h3>
        <form onSubmit={onPlan} className="form-grid">
          <div className="form-field">
            <label htmlFor="source">Source</label>
            <input id="source" className="input" placeholder="e.g. Bengaluru, Karnataka"
              value={source} onChange={(e) => setSource(e.target.value)} autoComplete="off" />
          </div>
          <div className="form-field">
            <label htmlFor="destination">Destination</label>
            <input id="destination" className="input" placeholder="e.g. Chennai, Tamil Nadu"
              value={destination} onChange={(e) => setDestination(e.target.value)} autoComplete="off" />
          </div>
          <div className="form-field full" style={{ flexDirection: "row", gap: 10 }}>
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? "Planning…" : "Visualize Route"}
            </button>
            <button type="button" className="button secondary" onClick={onClear} disabled={loading}>Clear</button>
          </div>
          {error && (
            <div className="form-field full" style={{ color: "var(--danger)", fontWeight: 700 }}>{error}</div>
          )}
        </form>
      </div>

      {result && (
        <div className="grid grid-3" style={{ marginBottom: 18 }}>
          <div className="metric-card">
            <div className="metric-label">Distance</div>
            <div className="metric-value">{result.distanceKm.toFixed(1)} km</div>
            <div className="metric-note">Driving distance via road network</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Estimated Duration</div>
            <div className="metric-value">
              {result.durationMin >= 60
                ? `${Math.floor(result.durationMin / 60)}h ${Math.round(result.durationMin % 60)}m`
                : `${Math.round(result.durationMin)} min`}
            </div>
            <div className="metric-note">Based on average driving conditions</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Waypoints</div>
            <div className="metric-value">{result.coords.length}</div>
            <div className="metric-note">Route geometry points rendered</div>
          </div>
        </div>
      )}

      <div className="panel" style={{ padding: 0, overflow: "hidden", height: 520 }}>
        <MapContainer center={initialCenter} zoom={5} style={{ height: "100%", width: "100%" }} ref={mapRef} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {result && (
            <>
              <Marker position={[result.from.lat, result.from.lon]} icon={sourceIcon}>
                <Popup><strong>Source</strong><div style={{ maxWidth: 220 }}>{result.from.label}</div></Popup>
              </Marker>
              <Marker position={[result.to.lat, result.to.lon]} icon={destIcon}>
                <Popup><strong>Destination</strong><div style={{ maxWidth: 220 }}>{result.to.label}</div></Popup>
              </Marker>
              <Polyline positions={result.coords} pathOptions={{ color: "#146c94", weight: 5, opacity: 0.85 }} />
              <FitBounds bounds={bounds} />
            </>
          )}
        </MapContainer>
      </div>

      {result && (
        <div className="panel" style={{ marginTop: 18 }}>
          <h3 className="section-title">Route summary</h3>
          <div className="grid grid-2">
            <div>
              <div className="metric-label">From</div>
              <div style={{ marginTop: 6, fontWeight: 700 }}>{result.from.label}</div>
              <div className="metric-note">{result.from.lat.toFixed(4)}, {result.from.lon.toFixed(4)}</div>
            </div>
            <div>
              <div className="metric-label">To</div>
              <div style={{ marginTop: 6, fontWeight: 700 }}>{result.to.label}</div>
              <div className="metric-note">{result.to.lat.toFixed(4)}, {result.to.lon.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteManagement;
