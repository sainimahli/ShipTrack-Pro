import { useEffect, useState } from "react";
import { getDeliveryPerformanceReport, downloadReport } from "../services/api";

// ---------------------------------------------------------------------------
// Performance Metrics Card Component
// ---------------------------------------------------------------------------
function MetricCard({ label, value, unit = "", color = "#146c94", icon = "📦" }) {
  return (
    <article className="performance-metric-card">
      <div className="metric-icon" style={{ fontSize: 28 }}>{icon}</div>
      <div className="metric-content">
        <div className="metric-label">{label}</div>
        <div className="metric-value" style={{ color }}>
          {value}
          {unit && <span className="metric-unit">{unit}</span>}
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Performance Gauge Chart
// ---------------------------------------------------------------------------
function PerformanceGauge({ value, max = 100, label, color = "#148f77" }) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="gauge-container">
      <svg width="120" height="120" viewBox="0 0 120 120" className="gauge-svg">
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="#e4ebf2"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dy="0.3em"
          fill="#132238"
          fontSize="24"
          fontWeight="800"
        >
          {percentage.toFixed(0)}%
        </text>
      </svg>
      <div className="gauge-label">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Performance Report Component
// ---------------------------------------------------------------------------
export default function DeliveryPerformanceReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState(null);

  // -------------------------------------------------------------------------
  // Load Performance Report
  // -------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getDeliveryPerformanceReport();
        if (isMounted) {
          setReport(response.data);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading performance report:", err);
          setError(
            err.response?.status === 403
              ? "You don't have permission to view this report"
              : "Failed to load performance report. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Export Report
  // -------------------------------------------------------------------------
  const handleExport = async (format) => {
    setExporting(true);
    setExportNotice(null);
    try {
      const response = await downloadReport("performance", format);
      const mimeType =
        format === "pdf" ? "application/pdf" : "text/csv";
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `delivery-performance-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setExportNotice({
        type: "success",
        text: `Performance report exported as ${format.toUpperCase()}.`,
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
  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="eyebrow">Analytics &amp; Visibility</div>
            <h1>Delivery Performance Report</h1>
          </div>
        </div>
        <div className="alert" style={{ marginBottom: 18 }}>
          Loading performance data…
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="page-header">
        <div>
          <div className="eyebrow">Analytics &amp; Visibility</div>
          <h1>Delivery Performance Report</h1>
          <p className="subtle">
            Comprehensive delivery performance metrics including on-time rates,
            success rates, and average delivery times.
          </p>
        </div>
        <div className="row-actions">
          <button
            className="button secondary compact"
            disabled={exporting || !report}
            onClick={() => handleExport("csv")}
            type="button"
          >
            Export CSV
          </button>
          <button
            className="button primary compact"
            disabled={exporting || !report}
            onClick={() => handleExport("pdf")}
            type="button"
          >
            Export PDF
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

      {error && (
        <div className="alert error" style={{ marginBottom: 18 }}>
          {error}
        </div>
      )}

      {report ? (
        <>
          {/* ------------------------------------------------------------------ */}
          {/* 1. Summary Metrics Cards                                            */}
          {/* ------------------------------------------------------------------ */}
          <section className="grid grid-3" style={{ marginBottom: 28 }}>
            <MetricCard
              label="Total Deliveries"
              value={report.totalDeliveries}
              icon="📦"
              color="#146c94"
            />
            <MetricCard
              label="On-Time Deliveries"
              value={report.onTimeDeliveries}
              icon="✓"
              color="#148f77"
            />
            <MetricCard
              label="Delayed Deliveries"
              value={report.delayedDeliveries}
              icon="⏰"
              color="#f59e0b"
            />
          </section>

          {/* ------------------------------------------------------------------ */}
          {/* 2. Average Delivery Time                                            */}
          {/* ------------------------------------------------------------------ */}
          <section className="panel" style={{ marginBottom: 28 }}>
            <h2 className="section-title">Average Delivery Time</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "20px 0" }}>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: "#146c94",
                }}
              >
                {report.averageDeliveryTime}
              </div>
              <p className="subtle" style={{ fontSize: 14, maxWidth: 300 }}>
                The average time taken from pickup to delivery across all completed shipments.
              </p>
            </div>
          </section>

          {/* ------------------------------------------------------------------ */}
          {/* 3. Performance Gauges (Success & Failure Rates)                     */}
          {/* ------------------------------------------------------------------ */}
          <section className="grid grid-2" style={{ marginBottom: 28 }}>
            <article className="panel gauge-panel">
              <h3 className="section-title">Delivery Success Rate</h3>
              <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                <PerformanceGauge
                  value={report.deliverySuccessRate}
                  max={100}
                  label={`${report.deliverySuccessRate.toFixed(2)}%`}
                  color="#148f77"
                />
              </div>
              <p className="subtle" style={{ fontSize: 12, textAlign: "center" }}>
                Percentage of successful deliveries out of total completed shipments
              </p>
            </article>

            <article className="panel gauge-panel">
              <h3 className="section-title">Delivery Failure Rate</h3>
              <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                <PerformanceGauge
                  value={report.deliveryFailureRate}
                  max={100}
                  label={`${report.deliveryFailureRate.toFixed(2)}%`}
                  color="#c2410c"
                />
              </div>
              <p className="subtle" style={{ fontSize: 12, textAlign: "center" }}>
                Percentage of failed deliveries out of total completed shipments
              </p>
            </article>
          </section>

          {/* ------------------------------------------------------------------ */}
          {/* 4. Performance Summary Table                                        */}
          {/* ------------------------------------------------------------------ */}
          <section className="panel">
            <h2 className="section-title">Performance Summary</h2>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Total Deliveries</strong></td>
                    <td>{report.totalDeliveries}</td>
                  </tr>
                  <tr>
                    <td><strong>On-Time Deliveries</strong></td>
                    <td>
                      <span className="badge success">
                        {report.onTimeDeliveries}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Delayed Deliveries</strong></td>
                    <td>
                      <span className="badge warning">
                        {report.delayedDeliveries}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Average Delivery Time</strong></td>
                    <td>{report.averageDeliveryTime}</td>
                  </tr>
                  <tr>
                    <td><strong>Delivery Success Rate</strong></td>
                    <td>
                      <strong style={{ color: "#148f77" }}>
                        {report.deliverySuccessRate.toFixed(2)}%
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Delivery Failure Rate</strong></td>
                    <td>
                      <strong style={{ color: "#c2410c" }}>
                        {report.deliveryFailureRate.toFixed(2)}%
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ------------------------------------------------------------------ */}
          {/* 5. Key Insights                                                     */}
          {/* ------------------------------------------------------------------ */}
          <section className="panel insights-panel">
            <h2 className="section-title">Key Insights</h2>
            <div className="insights-grid">
              <div className="insight-item">
                <div className="insight-icon">📊</div>
                <div className="insight-content">
                  <h4>Overall Performance</h4>
                  <p>
                    {report.totalDeliveries > 0 ? (
                      <>
                        You have completed <strong>{report.totalDeliveries}</strong> deliveries with
                        a success rate of <strong>{report.deliverySuccessRate.toFixed(2)}%</strong>.
                      </>
                    ) : (
                      "No completed deliveries yet."
                    )}
                  </p>
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-icon">⏱️</div>
                <div className="insight-content">
                  <h4>Delivery Efficiency</h4>
                  <p>
                    {report.onTimeDeliveries > 0 ? (
                      <>
                        <strong>{report.onTimeDeliveries}</strong> deliveries were completed on time,
                        with an average delivery time of <strong>{report.averageDeliveryTime}</strong>.
                      </>
                    ) : (
                      "Monitor delivery performance to improve on-time rates."
                    )}
                  </p>
                </div>
              </div>
              <div className="insight-item">
                <div className="insight-icon">⚠️</div>
                <div className="insight-content">
                  <h4>Areas for Improvement</h4>
                  <p>
                    {report.delayedDeliveries > 0 ? (
                      <>
                        <strong>{report.delayedDeliveries}</strong> deliveries were delayed.
                        Review routes and resources to improve on-time delivery rates.
                      </>
                    ) : (
                      "Excellent! All deliveries are on time."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="empty-state">
          <p>No performance data available at this time.</p>
        </div>
      )}
    </div>
  );
}
