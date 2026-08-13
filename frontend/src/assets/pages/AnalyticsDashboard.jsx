import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/auth";
import {
  getAdminDashboardAnalytics,
  getBusinessDashboardAnalytics,
  getCustomerDashboardAnalytics,
} from "../services/api";
import "./AnalyticsDashboard.css";

const dashboards = {
  customer: {
    label: "Customer Dashboard",
    eyebrow: "Personal delivery intelligence",
    title: "Your deliveries, made clear.",
    description: "Follow every shipment, spot delivery milestones, and stay one step ahead of every update.",
    modules: ["Active shipments", "Shipment history", "Delivery status overview", "Notification center", "Tracking insights"],
  },
  business: {
    label: "Business Dashboard",
    eyebrow: "Operations intelligence",
    title: "Move your delivery operation forward.",
    description: "A complete read on volumes, carrier performance, delays, and your most active customer accounts.",
    modules: ["Shipment analytics", "Delivery performance", "Delay analysis", "Logistics overview", "Customer activity"],
  },
  admin: {
    label: "Admin & Logistics Dashboard",
    eyebrow: "Platform command center",
    title: "See the whole network at once.",
    description: "Monitor platform health, shipment movement, users, routes, and analytics from a single operational view.",
    modules: ["User management", "Shipment monitoring", "Delivery analytics", "Route performance", "System monitoring", "Reports management"],
  },
  unsupported: {
    label: "Analytics unavailable",
    eyebrow: "Role-based access",
    title: "Analytics are not available for this role.",
    description: "No dedicated analytics endpoint is currently available.",
    modules: [],
  },
};

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
}

function getDashboardScope(role) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "BUSINESS_CLIENT") {
    return "business";
  }

  if (normalizedRole === "ADMINISTRATOR") {
    return "admin";
  }

  if (normalizedRole === "CUSTOMER") return "customer";

  return "unsupported";
}

const analyticsRequests = {
  customer: getCustomerDashboardAnalytics,
  business: getBusinessDashboardAnalytics,
  admin: getAdminDashboardAnalytics,
};

const dashboardLabels = {
  customer: "Customer Dashboard",
  business: "Business Dashboard",
  admin: "Admin & Logistics Dashboard",
  unsupported: "Analytics unavailable",
};

function buildModuleDetails(dashboardData) {
  const rows = [
    ["Total shipments", String(dashboardData.total), "Backend analytics"],
    ["Active shipments", String(dashboardData.activeCount), "Backend analytics"],
    ["Completed / delivered", String(dashboardData.delivered), "Backend analytics"],
    ["Pending shipments", String(dashboardData.pending), "Backend analytics"],
    ["Failed shipments", String(dashboardData.failed), "Backend analytics"],
    ["Cancelled shipments", String(dashboardData.cancelled), "Backend analytics"],
  ];

  return Object.fromEntries(
    Object.values(dashboards)
      .flatMap((dashboard) => dashboard.modules)
      .map((module) => [module, {
        metric: `${dashboardData.total} shipments`,
        description: "Values are supplied by the role-specific analytics API.",
        rows,
      }]),
  );
}

function DonutChart({ data = [], total = 0 }) {
  return <div className="donut-wrap">
    <svg className="donut" viewBox="0 0 42 42" aria-label="Delivery status pie chart" role="img">
      <circle cx="21" cy="21" fill="transparent" r="15.9" stroke="#edf1f6" strokeWidth="6" />
      {data.map(([name, value, color], index) => <circle key={name} cx="21" cy="21" fill="transparent" r="15.9" stroke={color} strokeDasharray={`${value} ${100 - value}`} strokeDashoffset={-data.slice(0, index).reduce((sum, [, previous]) => sum + previous, 0)} strokeWidth="6" />)}
    </svg>
    <div className="donut-center"><strong>{total.toLocaleString()}</strong><span>shipments</span></div>
  </div>;
}

function TrendChart({ values }) {
  const maximum = Math.max(...values, 1);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 640},${190 - (value / maximum) * 150}`).join(" ");
  return <svg className="trend-chart" viewBox="0 0 640 210" preserveAspectRatio="none" role="img" aria-label="Weekly shipment volume chart">
    <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#218a88" stopOpacity=".22"/><stop offset="1" stopColor="#218a88" stopOpacity="0"/></linearGradient></defs>
    {[38, 84, 130, 176].map((y) => <line key={y} x1="0" x2="640" y1={y} y2={y} stroke="#e8edf4" />)}
    <polygon points={`0,210 ${points} 640,210`} fill="url(#chartFill)" />
    <polyline points={points} fill="none" stroke="#218a88" strokeLinecap="round" strokeWidth="4" />
    {values.map((value, index) => <circle key={index} cx={(index / (values.length - 1)) * 640} cy={190 - (value / maximum) * 150} fill="#fff" r="4" stroke="#218a88" strokeWidth="3" />)}
  </svg>;
}

function AnalyticsDashboard() {
  const { auth } = useContext(AuthContext);
  const [range, setRange] = useState("Last 30 days");
  const [activeModule, setActiveModule] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const selected = getDashboardScope(auth?.user?.role);
  const data = dashboards[selected];
  const dashboardLabel = dashboardLabels[selected];

  useEffect(() => {
    const request = analyticsRequests[selected];

    if (!request) {
      return;
    }

    let isCurrent = true;
    const requestTimer = window.setTimeout(() => {
      setLoadingAnalytics(true);
      setAnalyticsError("");
      request()
        .then(({ data: response }) => {
          if (isCurrent) setAnalytics(response);
        })
        .catch((error) => {
          if (isCurrent) {
            setAnalytics(null);
            setAnalyticsError(error.response?.data?.message || "Unable to load analytics from the backend.");
          }
        })
        .finally(() => {
          if (isCurrent) setLoadingAnalytics(false);
        });
    }, 0);

    return () => {
      isCurrent = false;
      window.clearTimeout(requestTimer);
    };
  }, [selected]);

  const dashboardData = useMemo(() => {
    const value = (key) => (typeof analytics?.[key] === "number" ? analytics[key] : 0);
    const total = value("totalShipments");
    const active = value("activeShipments");
    const pending = value("pendingShipments");
    const failed = value("failedShipments");
    const cancelled = value("cancelledShipments");
    const delivered = selected === "customer"
      ? value("deliveredShipments")
      : selected === "business"
        ? value("completedShipments")
        : value("successfulShipments");
    const delayed = value("delayedShipments");
    const returned = value("returnedShipments");
    const deliverySuccessRate = selected === "customer" ? null : value("deliverySuccessRate");
    const percentage = (count) => total > 0 ? (count / total) * 100 : 0;
    const statusData = selected === "business"
      ? [["Completed", percentage(delivered), "#1da581", "green"], ["Active", percentage(active), "#218a88", "blue"], ["Delayed", percentage(delayed), "#f2a93b", "amber"], ["Failed", percentage(failed), "#ed6a5e", "red"]]
      : selected === "admin"
        ? [["Successful", percentage(delivered), "#1da581", "green"], ["Pending", percentage(pending), "#218a88", "blue"], ["Cancelled", percentage(cancelled), "#f2a93b", "amber"], ["Failed", percentage(failed), "#ed6a5e", "red"]]
        : [["Delivered", percentage(delivered), "#1da581", "green"], ["Active", percentage(active), "#218a88", "blue"], ["Pending", percentage(pending), "#f2a93b", "amber"], ["Failed", percentage(failed), "#ed6a5e", "red"]];

    return {
      total, pending, failed, cancelled, delayed, returned, delivered,
      onTimeRate: deliverySuccessRate ?? "N/A",
      deliverySuccessRate,
      activeCount: active,
      statusData,
      flow: selected === "business"
        ? [["Active", active], ["Completed", delivered], ["Delayed", delayed], ["Failed", failed]]
        : selected === "admin"
          ? [["Pending", pending], ["Successful", delivered], ["Failed", failed], ["Cancelled", cancelled], ["Returned", returned]]
          : [["Active", active], ["Pending", pending], ["Delivered", delivered], ["Failed", failed], ["Cancelled", cancelled]],
      week: [total, active, delivered, pending, failed, cancelled, returned],
    };
  }, [analytics, selected]);

  const roleMetrics = useMemo(() => {
    if (selected === "admin") {
      return [
        ["Total Shipments", dashboardData.total ?? "—", "All shipments in the network", "blue"],
        ["Pending Shipments", dashboardData.pending ?? "—", "Awaiting delivery completion", "amber"],
        ["Failed Shipments", dashboardData.failed ?? "—", "Delivery exceptions recorded", "red"],
        ["Successful Deliveries", dashboardData.delivered ?? "—", "Delivered shipments", "green"],
      ];
    }

    if (selected === "business") {
      return [
        ["Shipment volume", dashboardData.total.toString(), "Backend shipment volume", "blue"],
        ["On-time delivery", `${dashboardData.deliverySuccessRate}%`, "Performance across shipments", "green"],
        ["At-risk shipments", dashboardData.delayed.toString(), "Review delayed delivery cases", "amber"],
      ];
    }

    if (selected === "customer") {
      return [
        ["Active shipments", dashboardData.activeCount.toString(), "Backend active shipments", "blue"],
        ["Delivered shipments", dashboardData.delivered.toString(), "Backend delivered shipments", "green"],
        ["Need attention", `${dashboardData.failed + dashboardData.pending}`, "Backend failed or pending shipments", "amber"],
      ];
    }

    return [];
  }, [selected, dashboardData]);

  const moduleDetails = useMemo(() => buildModuleDetails(dashboardData), [dashboardData]);
  const selectedModule = activeModule ? moduleDetails[activeModule] : null;
  const percentage = dashboardData.deliverySuccessRate ?? "N/A";
  const currentFlow = dashboardData.flow;
  const trendValues = dashboardData.week;

  const openModule = (module) => setActiveModule(module === activeModule ? null : module);

  return <div className="analytics-page">
    <section className="analytics-hero">
      <div><p>{data.eyebrow}</p><h1>{data.title}</h1><span>{data.description}</span></div>
      <div className="analytics-controls"><label>Reporting period<select value={range} onChange={(event) => setRange(event.target.value)}><option>Last 7 days</option><option>Last 30 days</option><option>Last quarter</option></select></label><button type="button">Export report <span>↓</span></button></div>
    </section>

    <div className="role-banner"><span>Viewing analytics for</span><strong>{dashboardLabel}</strong><i>{loadingAnalytics ? "Loading live metrics" : analyticsError || "Role-based access"}</i></div>

    <section className="metric-row">{roleMetrics.map(([label, value, note, tone]) => <article className={`analytics-metric ${tone}`} key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section>

    <section className="analytics-grid main-grid">
      <article className="analytics-card volume-card"><div className="card-heading"><div><span>Shipment analytics</span><h2>Shipment volume</h2></div><b>{`${dashboardData.total.toLocaleString()} total`}</b></div><TrendChart values={trendValues} /><div className="chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></article>
      {selected === "admin" && <article className="analytics-card status-card dynamic-status-card"><div className="card-heading"><div><span>Delivery status overview</span><h2>Where shipments stand</h2></div><button className="icon-button" type="button">...</button></div><div className="status-content"><DonutChart data={dashboardData.statusData.map(([label, value, color]) => [label, value, color])} total={dashboardData.total} /><div className="legend">{dashboardData.statusData.map(([label, value, , tone]) => <div key={label}><i className={tone}/><span>{label}</span><b>{Math.round(value)}%</b></div>)}</div></div></article>}
      <article className="analytics-card status-card"><div className="card-heading"><div><span>Delivery status overview</span><h2>Where shipments stand</h2></div><button className="icon-button" type="button">•••</button></div><div className="status-content"><DonutChart data={dashboardData.statusData.map(([label, value, color]) => [label, value, color])} total={dashboardData.total} /><div className="legend">{dashboardData.statusData.map(([label, value, , tone]) => <div key={label}><i className={tone}/><span>{label}</span><b>{Math.round(value)}%</b></div>)}</div></div></article>
    </section>

    <section className="analytics-grid lower-grid">
      <article className="analytics-card flow-card"><div className="card-heading"><div><span>Shipment monitoring</span><h2>Delivery flow</h2></div><b className="subtle-pill">Live</b></div><div className="flow-track">{currentFlow.map(([step, count], index) => <div className="flow-item" key={step}><div className={`flow-dot ${index === currentFlow.length - 1 ? "complete" : ""}`}>{index + 1}</div>{index < currentFlow.length - 1 && <div className="flow-line"/>}<strong>{count.toLocaleString()}</strong><span>{step}</span></div>)}</div><div className="flow-footnote"><span>Flow completion</span><b>{percentage}% <i/></b></div></article>
      {selected === "admin" && <article className="analytics-card insights-card dynamic-insights-card"><div className="card-heading"><div><span>Tracking insights</span><h2>Attention needed</h2></div><a href="#reports">View all</a></div><div className="alert-item"><i className="alert-mark warning">!</i><div><strong>{dashboardData.failed.toLocaleString()} shipments need attention</strong><span>Failed deliveries currently recorded in the network.</span></div><button type="button">Review</button></div><div className="alert-item"><i className="alert-mark info">↗</i><div><strong>{dashboardData.pending.toLocaleString()} shipments are pending</strong><span>Shipments that have not yet reached delivery completion.</span></div><button type="button">Details</button></div></article>}
      <article className="analytics-card insights-card"><div className="card-heading"><div><span>Tracking insights</span><h2>Attention needed</h2></div><a href="#reports">View all</a></div><div className="alert-item"><i className="alert-mark warning">!</i><div><strong>{dashboardData.failed.toLocaleString()} shipments need attention</strong><span>Performance and delivery exceptions can be monitored here.</span></div><button type="button">Review</button></div><div className="alert-item"><i className="alert-mark info">↗</i><div><strong>{dashboardData.onTimeRate}% delivery success</strong><span>Current delivery effectiveness across tracked shipments.</span></div><button type="button">Details</button></div></article>
    </section>

    <section className="feature-area" id="reports"><div className="feature-head"><div><span>{dashboardLabel.replace(" Dashboard", "")}</span><h2>{dashboardLabel}</h2></div><p>Role-specific frontend tools · {range}</p></div><div className="module-grid">{data.modules.map((module, index) => { const details = moduleDetails[module]; return <article className={activeModule === module ? "selected" : ""} key={module}><span>0{index + 1}</span><h3>{module}</h3><strong>{details?.metric || "—"}</strong><p>{details?.description || ""}</p><button type="button" onClick={() => openModule(module)}>{activeModule === module ? "Close" : "Open"} <b>→</b></button></article>; })}</div>
      {selectedModule && <article className="module-panel"><div><span>{activeModule}</span><h2>{selectedModule.metric}</h2><p>{selectedModule.description}</p></div><button className="close-module" type="button" onClick={() => setActiveModule(null)}>×</button><div className="module-data">{selectedModule.rows.map(([primary, secondary, state]) => <div key={`${primary}-${secondary}`}><strong>{primary}</strong><span>{secondary}</span><b>{state}</b></div>)}</div><button className="module-action" type="button">View full {activeModule.toLowerCase()} →</button></article>}
    </section>
  </div>;
}

export default AnalyticsDashboard;
