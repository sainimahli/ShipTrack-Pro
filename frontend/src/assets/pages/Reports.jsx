import { useContext, useEffect, useMemo, useState } from "react";
import { ShipmentContext } from "../context/shipments";
import { downloadReport, getAnalyticsDashboard } from "../services/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusClass(status) {
  if (!status) return "neutral";
  return status.toLowerCase().replaceAll(" ", "-");
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
      new Date(dateStr),
    );
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// SVG Chart 1 — Status Donut Chart
// ---------------------------------------------------------------------------
function StatusPieChart({ data }) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  if (total === 0) {
    return (
      <div className="empty-state" style={{ minHeight: 160 }}>
        No status data to display.
      </div>
    );
  }

  let cumulativeAngle = 0;
  const radius = 70;
  const strokeWidth = 26;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  const slices = data.map((item) => {
    const percentage = item.value / total;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += percentage;
    return { ...item, percentage, strokeDasharray, strokeDashoffset };
  });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 24,
        justifyContent: "center",
      }}
    >
      <svg width="200" height="200" viewBox="0 0 200 200" aria-label="Status distribution donut chart">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e4ebf2"
          strokeWidth={strokeWidth}
        />
        {slices.map((slice) => (
          <circle
            key={slice.label}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={strokeWidth}
            strokeDasharray={slice.strokeDasharray}
            strokeDashoffset={slice.strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          >
            <title>{`${slice.label}: ${slice.value} (${Math.round(slice.percentage * 100)}%)`}</title>
          </circle>
        ))}
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          fill="#132238"
          fontSize="22"
          fontWeight="800"
        >
          {total}
        </text>
        <text
          x={center}
          y={center + 16}
          textAnchor="middle"
          fill="#657184"
          fontSize="12"
          fontWeight="600"
        >
          Total
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: "grid", gap: 8, minWidth: 160 }}>
        {data.map((item) => (
          <div
            key={item.label}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                backgroundColor: item.color,
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, color: "#45576c" }}>{item.label}</span>
            <strong style={{ color: "#132238" }}>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Chart 2 — Monthly Shipments Bar Chart
// ---------------------------------------------------------------------------
function MonthlyBarChart({ data }) {
  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const height = 180;
  const width = 450;
  const barWidth = 36;
  const gap = (width - data.length * barWidth) / (data.length + 1);

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        width={width}
        height={height + 40}
        viewBox={`0 0 ${width} ${height + 40}`}
        aria-label="Monthly shipment volume bar chart"
      >
        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = height - ratio * (height - 30);
          return (
            <g key={ratio}>
              <line
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke="#e4ebf2"
                strokeDasharray="3 3"
              />
              <text x="4" y={y - 4} fill="#94a3b8" fontSize="10">
                {Math.round(ratio * maxValue)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = gap + i * (barWidth + gap);
          const barHeight = Math.max((d.count / maxValue) * (height - 30), d.count > 0 ? 4 : 0);
          const y = height - barHeight;
          return (
            <g key={d.month}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill="url(#barGradient)"
                style={{ transition: "all 0.3s ease" }}
              >
                <title>{`${d.month}: ${d.count} shipments`}</title>
              </rect>
              {d.count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fill="#132238"
                  fontSize="11"
                  fontWeight="700"
                >
                  {d.count}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={height + 20}
                textAnchor="middle"
                fill="#657184"
                fontSize="11"
              >
                {d.month}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#146c94" />
            <stop offset="100%" stopColor="#0b4f6c" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Chart 3 — Shipment Trends Line Chart (by day of week)
// ---------------------------------------------------------------------------
function TrendsLineChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const height = 180;
  const width = 450;
  const padding = 30;

  const points = data.map((d, i) => {
    const x =
      padding + (i / Math.max(data.length - 1, 1)) * (width - 2 * padding);
    const y = height - (d.count / maxVal) * (height - 2 * padding);
    return { x, y, label: d.day, count: d.count };
  });

  const pathD = points.length
    ? points.reduce(
        (acc, p, i) =>
          i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`,
        "",
      )
    : "";

  const areaD = points.length
    ? `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : "";

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        width={width}
        height={height + 40}
        viewBox={`0 0 ${width} ${height + 40}`}
        aria-label="Weekly shipment creation trend line chart"
      >
        <defs>
          <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#146c94" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#146c94" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = height - ratio * (height - 2 * padding);
          return (
            <line
              key={ratio}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e4ebf2"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Area fill */}
        {areaD && <path d={areaD} fill="url(#lineAreaGradient)" />}

        {/* Trend polyline */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#146c94"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* Data points */}
        {points.map((p) => (
          <g key={p.label}>
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill="#ffffff"
              stroke="#146c94"
              strokeWidth="3"
            >
              <title>{`${p.label}: ${p.count} shipments`}</title>
            </circle>
            <text
              x={p.x}
              y={height + 20}
              textAnchor="middle"
              fill="#657184"
              fontSize="10"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Reports Page Component
// ---------------------------------------------------------------------------
export default function Reports() {
  const {
    shipments,
    loading: shipmentsLoading,
    error: shipmentsError,
  } = useContext(ShipmentContext);

  // analytics from backend (admin-only; falls back gracefully for other roles)
  const [analytics, setAnalytics] = useState(null);

  // export state
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState(null);

  // filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // -------------------------------------------------------------------------
  // Load analytics — silently degrades for non-admin (403) or any other error
  // -------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    getAnalyticsDashboard()
      .then((res) => {
        if (isMounted) setAnalytics(res.data);
      })
      .catch(() => {
        // Expected for non-admin users (403) or when backend is unavailable.
        // Client-side counts derived from ShipmentContext are used as fallback.
        if (isMounted) setAnalytics(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Derived counts — prefer backend analytics, fall back to local calculation
  // -------------------------------------------------------------------------
  const totalCount =
    analytics?.totalShipments ?? shipments.length;

  const deliveredCount =
    analytics?.successfulShipments ??
    shipments.filter((s) => s.status === "Delivered").length;

  const inTransitCount = shipments.filter((s) =>
    ["In Transit", "Out for Delivery", "Picked Up"].includes(s.status),
  ).length;

  const pendingCount =
    analytics?.pendingShipments ??
    shipments.filter((s) =>
      ["Created", "Pending Approval"].includes(s.status),
    ).length;

  const cancelledCount =
    analytics?.failedShipments ??
    shipments.filter((s) =>
      ["Cancelled", "Failed Delivery", "Rejected"].includes(s.status),
    ).length;

  const completionRate =
    totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0;

  // -------------------------------------------------------------------------
  // Filtered shipments (search + status + date range)
  // -------------------------------------------------------------------------
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      if (statusFilter !== "All" && s.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const searchable = [
          s.trackingNumber,
          s.senderName,
          s.receiverName,
          s.senderCity,
          s.receiverCity,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(query)) return false;
      }

      if (startDate && s.createdAt && s.createdAt < startDate) return false;
      if (endDate && s.createdAt && s.createdAt > endDate) return false;

      return true;
    });
  }, [shipments, statusFilter, searchQuery, startDate, endDate]);

  // -------------------------------------------------------------------------
  // Chart datasets
  // -------------------------------------------------------------------------
  const statusPieData = useMemo(
    () => [
      { label: "Delivered", value: deliveredCount, color: "#148f77" },
      { label: "In Transit", value: inTransitCount, color: "#146c94" },
      { label: "Pending / Created", value: pendingCount, color: "#f59e0b" },
      { label: "Cancelled / Failed", value: cancelledCount, color: "#c2410c" },
    ],
    [deliveredCount, inTransitCount, pendingCount, cancelledCount],
  );

  const monthlyData = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const counts = {};
    months.forEach((m) => { counts[m] = 0; });

    shipments.forEach((s) => {
      if (s.createdAt) {
        const date = new Date(s.createdAt);
        if (!isNaN(date.getTime())) {
          counts[months[date.getMonth()]] =
            (counts[months[date.getMonth()]] || 0) + 1;
        }
      }
    });

    const currentMonthIndex = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIndex - i + 12) % 12;
      const name = months[idx];
      last6Months.push({ month: name, count: counts[name] || 0 });
    }
    return last6Months;
  }, [shipments]);

  const trendsData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    shipments.forEach((s) => {
      if (s.createdAt) {
        const d = new Date(s.createdAt);
        if (!isNaN(d.getTime())) {
          dayCounts[days[d.getDay()]] = (dayCounts[days[d.getDay()]] || 0) + 1;
        }
      }
    });

    return days.map((day) => ({ day, count: dayCounts[day] }));
  }, [shipments]);

  // -------------------------------------------------------------------------
  // Export — uses existing ReportController (/api/reports/{type}/{format})
  // -------------------------------------------------------------------------
  const handleExport = async (type, format) => {
    setExporting(true);
    setExportNotice(null);
    try {
      const response = await downloadReport(type, format);
      const mimeType =
        format === "pdf" ? "application/pdf" : "text/csv";
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${type}-shipment-report.${format}`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportNotice({
        type: "success",
        text: `${type.charAt(0).toUpperCase() + type.slice(1)} report exported as ${format.toUpperCase()}.`,
      });
    } catch (err) {
      console.error("Export error:", err);
      setExportNotice({
        type: "error",
        text: "Could not generate report. Ensure the backend is running and you are authenticated.",
      });
    } finally {
      setExporting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="page">

      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="page-header">
        <div>
          <div className="eyebrow">Analytics &amp; Visibility</div>
          <h1>Shipment Reports</h1>
          <p className="subtle">
            Comprehensive shipment analytics, status distribution, monthly
            volume trends, and report exports.
          </p>
        </div>
        <div className="row-actions">
          <button
            className="button secondary compact"
            disabled={exporting}
            onClick={() => handleExport("weekly", "csv")}
            type="button"
          >
            Weekly (CSV)
          </button>
          <button
            className="button secondary compact"
            disabled={exporting}
            onClick={() => handleExport("monthly", "csv")}
            type="button"
          >
            Monthly (CSV)
          </button>
          <button
            className="button primary compact"
            disabled={exporting}
            onClick={() => handleExport("weekly", "pdf")}
            type="button"
          >
            Weekly (PDF)
          </button>
          <button
            className="button primary compact"
            disabled={exporting}
            onClick={() => handleExport("monthly", "pdf")}
            type="button"
          >
            Monthly (PDF)
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Notices                                                             */}
      {/* ------------------------------------------------------------------ */}
      {exportNotice && (
        <div
          className={`alert ${exportNotice.type}`}
          style={{ marginBottom: 18 }}
        >
          {exportNotice.text}
        </div>
      )}
      {shipmentsError && (
        <div className="alert error" style={{ marginBottom: 18 }}>
          {shipmentsError}
        </div>
      )}
      {shipmentsLoading && (
        <div className="alert" style={{ marginBottom: 18 }}>
          Loading report data…
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. Summary cards                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="grid grid-4" style={{ marginBottom: 24 }}>
        <article className="metric-card">
          <div className="metric-label">Total Shipments</div>
          <div className="metric-value">{totalCount}</div>
          <div className="metric-note">All registered records</div>
        </article>

        <article className="metric-card">
          <div className="metric-label">Delivered</div>
          <div className="metric-value" style={{ color: "#148f77" }}>
            {deliveredCount}
          </div>
          <div className="metric-note">{completionRate}% completion rate</div>
        </article>

        <article className="metric-card">
          <div className="metric-label">Pending / In Transit</div>
          <div className="metric-value" style={{ color: "#146c94" }}>
            {pendingCount + inTransitCount}
          </div>
          <div className="metric-note">
            {pendingCount} pending · {inTransitCount} active on route
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-label">Cancelled / Failed</div>
          <div className="metric-value" style={{ color: "#c2410c" }}>
            {cancelledCount}
          </div>
          <div className="metric-note">Exceptions &amp; cancellations</div>
        </article>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Charts                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="grid grid-3" style={{ marginBottom: 24 }}>
        <article className="panel">
          <h3 className="section-title">Status Distribution</h3>
          <p className="subtle" style={{ fontSize: 12, marginBottom: 16 }}>
            Breakdown by shipment status
          </p>
          <StatusPieChart data={statusPieData} />
        </article>

        <article className="panel">
          <h3 className="section-title">Monthly Volume</h3>
          <p className="subtle" style={{ fontSize: 12, marginBottom: 16 }}>
            Shipment volume over the last 6 months
          </p>
          <MonthlyBarChart data={monthlyData} />
        </article>

        <article className="panel">
          <h3 className="section-title">Weekly Trend</h3>
          <p className="subtle" style={{ fontSize: 12, marginBottom: 16 }}>
            Creation activity by day of week
          </p>
          <TrendsLineChart data={trendsData} />
        </article>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Filters + data table                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="panel">
        <div className="toolbar" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="filters" style={{ flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <input
              className="input"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracking #, customer, city"
              style={{ minWidth: 240 }}
              value={searchQuery}
            />
            <select
              className="select"
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: 160 }}
              value={statusFilter}
            >
              <option value="All">All Statuses</option>
              <option value="Created">Created</option>
              <option value="Picked Up">Picked Up</option>
              <option value="In Transit">In Transit</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Failed Delivery">Failed Delivery</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label
                htmlFor="report-from"
                style={{ fontSize: 12, fontWeight: 700, color: "#657184" }}
              >
                From:
              </label>
              <input
                className="input"
                id="report-from"
                onChange={(e) => setStartDate(e.target.value)}
                type="date"
                value={startDate}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label
                htmlFor="report-to"
                style={{ fontSize: 12, fontWeight: 700, color: "#657184" }}
              >
                To:
              </label>
              <input
                className="input"
                id="report-to"
                onChange={(e) => setEndDate(e.target.value)}
                type="date"
                value={endDate}
              />
            </div>
          </div>
          <span className="subtle" style={{ fontSize: 13 }}>
            Showing {filteredShipments.length} of {shipments.length} records
          </span>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking Number</th>
                <th>Customer / Sender</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Delivery / ETA</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment) => (
                <tr key={shipment.id || shipment.trackingNumber}>
                  <td>
                    <strong>{shipment.trackingNumber}</strong>
                  </td>
                  <td>
                    {shipment.senderName ||
                      shipment.receiverName ||
                      "Standard Client"}
                  </td>
                  <td>{shipment.senderCity || "N/A"}</td>
                  <td>{shipment.receiverCity || "N/A"}</td>
                  <td>
                    <span className={`badge ${statusClass(shipment.status)}`}>
                      {shipment.status}
                    </span>
                  </td>
                  <td>{formatDate(shipment.createdAt)}</td>
                  <td>
                    {formatDate(
                      shipment.eta || shipment.expectedDeliveryDate,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredShipments.length === 0 && (
          <div className="empty-state">
            No shipments match the selected filters or date range.
          </div>
        )}
      </section>
    </div>
  );
}
