import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/auth";
import { ShipmentContext } from "../context/shipments";
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
};

function parseJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
}

function getDashboardScope(role) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "BUSINESS_CLIENT") {
    return "business";
  }

  if (["ADMINISTRATOR", "LOGISTICS_OPERATOR", "SUPPORT_AGENT"].includes(normalizedRole)) {
    return "admin";
  }

  return "customer";
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
};

function sortByDate(items, field, limit) {
  return [...items]
    .filter((item) => item[field])
    .sort((a, b) => new Date(b[field]) - new Date(a[field]))
    .slice(0, limit);
}

function countBy(items, criterion) {
  return items.reduce((acc, item) => {
    const key = criterion(item) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildModuleDetails(shipments, dashboardData) {
  const { total, delivered, failed, pending, activeCount, onTimeRate, statusData } = dashboardData;

  return {
    "Active shipments": {
      metric: `${activeCount} live`,
      description: "Packages currently moving through your delivery journey.",
      rows: sortByDate(shipments.filter((s) => !["Delivered", "Cancelled", "Rejected", "Pending Approval"].includes(s.status)), "createdAt", 3).map((shipment) => [
        shipment.trackingNumber || "Unknown",
        `${shipment.senderCity || "Unknown"} → ${shipment.receiverCity || "Unknown"}`,
        shipment.status,
      ]),
    },
    "Shipment history": {
      metric: `${delivered} delivered`,
      description: "Your latest completed shipment records and proof-of-delivery status.",
      rows: sortByDate(shipments.filter((s) => s.status === "Delivered"), "createdAt", 3).map((shipment) => [
        shipment.trackingNumber || "Unknown",
        `Delivered ${new Date(shipment.createdAt).toLocaleDateString()}`,
        shipment.status,
      ]),
    },
    "Delivery status overview": {
      metric: `${onTimeRate}% on time`,
      description: "A breakdown of delivery milestones across your shipments.",
      rows: statusData.map(([label, value]) => [label, `${Math.round(value)}%`, `${Math.round((value / 100) * total)} shipments`]),
    },
    "Notification center": {
      metric: `${Math.max(0, failed + pending)} alerts`,
      description: "Important updates from your active deliveries.",
      rows: [
        ["ETA updated", "Track closest shipments", "Live update"],
        ["Delay detected", "Review exceptions", "Pending"],
        ["Delivery complete", "Completed shipments", "Success"],
      ],
    },
    "Tracking insights": {
      metric: `${failed + pending} issues`,
      description: "Predictive signals based on package scans and route progress.",
      rows: [
        ["On schedule", `${Math.max(0, 100 - failed - pending)}%`, "Healthy"],
        ["Possible delay", `${pending} shipments`, "Review ETA"],
        ["Failed delivery", `${failed} shipments`, "Escalate"],
      ],
    },
    "Shipment analytics": {
      metric: `${total} shipments`,
      description: "Volume, service type, and route trends for your account.",
      rows: Object.entries(countBy(shipments, (shipment) => `${shipment.senderCity || "Unknown"} → ${shipment.receiverCity || "Unknown"}`))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([route, count]) => [route, String(count), `${Math.round((count / Math.max(total, 1)) * 100)}%`]),
    },
    "Delivery performance": {
      metric: `${onTimeRate}% on time`,
      description: "Carrier service performance against promised delivery dates.",
      rows: [["On-time delivery", `${onTimeRate}%`, `${delivered} completed`], ["Delayed shipments", `${failed}`, "Review now"], ["Pending deliveries", `${pending}`, "Monitor"]],
    },
    "Delay analysis": {
      metric: `${failed} at risk`,
      description: "Delay causes and the shipments that need operational attention.",
      rows: [["Bad address", `${failed}`, "Investigate"], ["Weather impact", "Varies", "Review"], ["Carrier delay", "Varies", "Schedule" ]],
    },
    "Logistics overview": {
      metric: `${Math.max(1, new Set(shipments.map((shipment) => `${shipment.senderCity || "Unknown"} → ${shipment.receiverCity || "Unknown"}`)).size)} active routes`,
      description: "Route capacity, fleet movement, and fulfilment status.",
      rows: [["Active routes", `${Math.max(1, new Set(shipments.map((shipment) => `${shipment.senderCity || "Unknown"} → ${shipment.receiverCity || "Unknown"}`)).size)}`, "Tracking"], ["Total shipments", `${total}`, "Live"], ["Delayed shipments", `${failed}`, "Review"]],
    },
    "Customer activity": {
      metric: `${new Set(shipments.map((shipment) => shipment.userId)).size} active accounts`,
      description: "Customer shipment behaviour and support signals.",
      rows: [["Unique customers", `${new Set(shipments.map((shipment) => shipment.userId)).size}`, "Across shipments"], ["Delivered shipments", `${delivered}`, "This period"], ["At-risk shipments", `${failed}`, "Needs attention"]],
    },
    "User management": {
      metric: `${new Set(shipments.map((shipment) => shipment.userId)).size} users`,
      description: "User access, approval queue, and account activity.",
      rows: [["Active users", `${new Set(shipments.map((shipment) => shipment.userId)).size}`, "Based on shipments"], ["Approval queue", `${pending}`, "Pending"], ["Support requests", `${failed}`, "Escalated"]],
    },
    "Shipment monitoring": {
      metric: `${total} tracked`,
      description: "Network-wide shipment health and live delivery exceptions.",
      rows: statusData.map(([label, value]) => [label, `${Math.round(value)}%`, `${Math.round((value / 100) * total)} shipments`]),
    },
    "Route performance": {
      metric: `${Math.max(1, new Set(shipments.map((shipment) => `${shipment.senderCity || "Unknown"} → ${shipment.receiverCity || "Unknown"}`)).size)} active routes`,
      description: "Compare network routes by ETA accuracy and delivery efficiency.",
      rows: Object.entries(countBy(shipments, (shipment) => `${shipment.senderCity || "Unknown"} → ${shipment.receiverCity || "Unknown"}`))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([route, count]) => [route, String(count), `${Math.round((count / Math.max(total, 1)) * 100)}%`]),
    },
    "System monitoring": {
      metric: `${Math.max(95, Math.min(100, 100 - failed))}% healthy`,
      description: "Live platform services, API availability, and background processing.",
      rows: [["API gateway", "Operational", "Stable"], ["Tracking flow", "Stable", "Monitoring"], ["Network health", `${Math.max(95, Math.min(100, 100 - failed))}%`, "Healthy"]],
    },
    "Reports management": {
      metric: `${Math.max(1, Math.ceil(total / 10))} scheduled`,
      description: "Create, schedule, and review analytics reports for your operation.",
      rows: [["Daily delivery report", "Active", `${Math.min(5, Math.max(1, total))}`], ["Weekly exceptions", "Review", `${failed} alerts`], ["Monthly performance", "Draft", `${onTimeRate}%`]],
    },
  };
}

function DonutChart({ data = [["Delivered", 61, "#1da581"], ["In transit", 24, "#3979e8"], ["Out for delivery", 10, "#f2a93b"], ["Exceptions", 5, "#ed6a5e"]], total = 1284 }) {
  let offset = 0;
  return <div className="donut-wrap">
    <svg className="donut" viewBox="0 0 42 42" aria-label="Delivery status pie chart" role="img">
      <circle cx="21" cy="21" fill="transparent" r="15.9" stroke="#edf1f6" strokeWidth="6" />
      {data.map(([name, value, color]) => { const segment = <circle key={name} cx="21" cy="21" fill="transparent" r="15.9" stroke={color} strokeDasharray={`${value} ${100 - value}`} strokeDashoffset={-offset} strokeWidth="6" />; offset += value; return segment; })}
    </svg>
    <div className="donut-center"><strong>{total.toLocaleString()}</strong><span>shipments</span></div>
  </div>;
}

function TrendChart({ values }) {
  const maximum = Math.max(...values, 1);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 640},${190 - (value / maximum) * 150}`).join(" ");
  return <svg className="trend-chart" viewBox="0 0 640 210" preserveAspectRatio="none" role="img" aria-label="Weekly shipment volume chart">
    <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#3979e8" stopOpacity=".22"/><stop offset="1" stopColor="#3979e8" stopOpacity="0"/></linearGradient></defs>
    {[38, 84, 130, 176].map((y) => <line key={y} x1="0" x2="640" y1={y} y2={y} stroke="#e8edf4" />)}
    <polygon points={`0,210 ${points} 640,210`} fill="url(#chartFill)" />
    <polyline points={points} fill="none" stroke="#3979e8" strokeLinecap="round" strokeWidth="4" />
    {values.map((value, index) => <circle key={index} cx={(index / (values.length - 1)) * 640} cy={190 - (value / maximum) * 150} fill="#fff" r="4" stroke="#3979e8" strokeWidth="3" />)}
  </svg>;
}

function AnalyticsDashboard() {
  const { auth } = useContext(AuthContext);
  const { shipments = [] } = useContext(ShipmentContext) || {};
  const [range, setRange] = useState("Last 30 days");
  const [activeModule, setActiveModule] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const selected = getDashboardScope(auth?.user?.role);
  const data = dashboards[selected];
  const dashboardLabel = dashboardLabels[selected];

  const currentUserId = useMemo(() => {
    const payload = parseJwtPayload(auth?.token);
    return payload?.sub ?? null;
  }, [auth?.token]);

  const visibleShipments = useMemo(() => {
    if (!shipments.length) return [];
    if (selected === "customer" || selected === "business") {
      if (!currentUserId) return shipments;
      return shipments.filter((shipment) => String(shipment.userId) === String(currentUserId));
    }
    return shipments;
  }, [shipments, selected, currentUserId]);

  useEffect(() => {
    const request = analyticsRequests[selected];

    if (!request) {
      return;
    }

    let isCurrent = true;
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

    return () => { isCurrent = false; };
  }, [selected]);

  const dashboardData = useMemo(() => {
    const count = (status) => visibleShipments.filter((shipment) => shipment.status === status).length;
    const total = visibleShipments.length;
    const delivered = count("Delivered");
    const failed = count("Failed Delivery");
    const pending = count("Created") + count("Picked Up") + count("In Transit") + count("Out for Delivery");
    const inTransit = count("Picked Up") + count("In Transit");
    const outForDelivery = count("Out for Delivery");
    const booked = count("Created");
    const onTimeRate = total ? Math.round((delivered / total) * 100) : 0;
    const statusData = [
      ["Delivered", total ? (delivered / total) * 100 : 0, "#1da581", "green"],
      ["In transit", total ? (inTransit / total) * 100 : 0, "#3979e8", "blue"],
      ["Out for delivery", total ? (outForDelivery / total) * 100 : 0, "#f2a93b", "amber"],
      ["Exceptions", total ? (failed / total) * 100 : 0, "#ed6a5e", "red"],
    ];
    const week = Array.from({ length: 7 }, (_, index) => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - (6 - index));
      return visibleShipments.filter(
        (shipment) => shipment.createdAt && new Date(shipment.createdAt).toDateString() === day.toDateString(),
      ).length;
    });

    const totalShipments = analytics?.totalShipments ?? total;
    const activeShipments = analytics?.activeShipments ?? visibleShipments.filter((shipment) => !["Delivered", "Cancelled", "Rejected", "Pending Approval"].includes(shipment.status)).length;
    const pendingShipments = analytics?.pendingShipments ?? pending;
    const failedShipments = analytics?.failedShipments ?? failed;
    const cancelledShipments = analytics?.cancelledShipments ?? count("Cancelled");
    const deliveredShipments = analytics?.deliveredShipments ?? analytics?.successfulShipments ?? analytics?.completedShipments ?? delivered;
    const delayedShipments = analytics?.delayedShipments ?? failedShipments;
    const returnedShipments = analytics?.returnedShipments ?? 0;
    const deliverySuccessRate = typeof analytics?.deliverySuccessRate === "number"
      ? Math.round(analytics.deliverySuccessRate)
      : (totalShipments ? Math.round((deliveredShipments / totalShipments) * 100) : onTimeRate);

    return {
      total: totalShipments,
      pending: pendingShipments,
      failed: failedShipments,
      cancelled: cancelledShipments,
      delayed: delayedShipments,
      returned: returnedShipments,
      delivered: deliveredShipments,
      booked,
      onTimeRate: deliverySuccessRate,
      deliverySuccessRate,
      activeCount: activeShipments,
      statusData,
      flow: [
        ["Booked", booked],
        ["Picked up", count("Picked Up")],
        ["In transit", count("In Transit")],
        ["Out for delivery", outForDelivery],
        ["Delivered", delivered],
      ],
      week,
    };
  }, [visibleShipments]);

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

    return [
      ["Active shipments", dashboardData.activeCount.toString(), `${dashboardData.activeCount} active`, "blue"],
      ["Delivered this month", dashboardData.delivered.toString(), `${dashboardData.deliverySuccessRate}% on time`, "green"],
      ["Need attention", `${dashboardData.failed + dashboardData.pending}`, "Delayed or pending deliveries", "amber"],
    ];
  }, [selected, dashboardData]);

  const moduleDetails = useMemo(() => buildModuleDetails(visibleShipments, dashboardData), [visibleShipments, dashboardData]);
  const selectedModule = activeModule ? moduleDetails[activeModule] : null;
  const percentage = dashboardData.deliverySuccessRate;
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
