import { useContext, useMemo, useState } from "react";
import { AuthContext } from "../context/auth";
import "./AnalyticsDashboard.css";

const dashboards = {
  customer: {
    label: "Customer Dashboard",
    eyebrow: "Personal delivery intelligence",
    title: "Your deliveries, made clear.",
    description: "Follow every shipment, spot delivery milestones, and stay one step ahead of every update.",
    metrics: [["Active shipments", "08", "+2 this week", "blue"], ["Delivered this month", "24", "96% on time", "green"], ["Need attention", "02", "Updated 18 min ago", "amber"]],
    modules: ["Active shipments", "Shipment history", "Delivery status overview", "Notification center", "Tracking insights"],
  },
  business: {
    label: "Business Dashboard",
    eyebrow: "Operations intelligence",
    title: "Move your delivery operation forward.",
    description: "A complete read on volumes, carrier performance, delays, and your most active customer accounts.",
    metrics: [["Shipment volume", "1,284", "+12.4% vs. last month", "blue"], ["On-time delivery", "94.8%", "+1.8% vs. target", "green"], ["At-risk shipments", "37", "8 require action", "amber"]],
    modules: ["Shipment analytics", "Delivery performance", "Delay analysis", "Logistics overview", "Customer activity"],
  },
  admin: {
    label: "Admin & Logistics Dashboard",
    eyebrow: "Platform command center",
    title: "See the whole network at once.",
    description: "Monitor platform health, shipment movement, users, routes, and analytics from a single operational view.",
    metrics: [["Network shipments", "12,480", "+9.2% vs. last month", "blue"], ["Successful delivery", "96.2%", "Above 95% goal", "green"], ["System health", "99.98%", "All services operational", "purple"]],
    modules: ["User management", "Shipment monitoring", "Delivery analytics", "Route performance", "System monitoring", "Reports management"],
  },
};

const flowSteps = [
  ["Booked", "1,284"], ["Picked up", "1,017"], ["In transit", "728"], ["Out for delivery", "216"], ["Delivered", "1,079"],
];

function DonutChart() {
  const data = [["Delivered", 61, "#1da581"], ["In transit", 24, "#3979e8"], ["Out for delivery", 10, "#f2a93b"], ["Exceptions", 5, "#ed6a5e"]];
  let offset = 0;
  return <div className="donut-wrap">
    <svg className="donut" viewBox="0 0 42 42" aria-label="Delivery status pie chart" role="img">
      <circle cx="21" cy="21" fill="transparent" r="15.9" stroke="#edf1f6" strokeWidth="6" />
      {data.map(([name, value, color]) => { const segment = <circle key={name} cx="21" cy="21" fill="transparent" r="15.9" stroke={color} strokeDasharray={`${value} ${100 - value}`} strokeDashoffset={-offset} strokeWidth="6" />; offset += value; return segment; })}
    </svg>
    <div className="donut-center"><strong>1,284</strong><span>shipments</span></div>
  </div>;
}

function TrendChart() {
  return <svg className="trend-chart" viewBox="0 0 640 210" preserveAspectRatio="none" role="img" aria-label="Weekly shipment volume chart">
    <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#3979e8" stopOpacity=".22"/><stop offset="1" stopColor="#3979e8" stopOpacity="0"/></linearGradient></defs>
    {[38, 84, 130, 176].map((y) => <line key={y} x1="0" x2="640" y1={y} y2={y} stroke="#e8edf4" />)}
    <path d="M0,165 C42,142 56,154 92,130 S150,88 185,114 S240,149 276,107 S330,80 370,100 S428,140 462,91 S530,52 572,70 S614,58 640,30 L640,210 L0,210 Z" fill="url(#chartFill)" />
    <path d="M0,165 C42,142 56,154 92,130 S150,88 185,114 S240,149 276,107 S330,80 370,100 S428,140 462,91 S530,52 572,70 S614,58 640,30" fill="none" stroke="#3979e8" strokeLinecap="round" strokeWidth="4" />
    {[0, 92, 185, 276, 370, 462, 572, 640].map((x, index) => <circle key={x} cx={x} cy={[165,130,114,107,100,91,70,30][index]} fill="#fff" r="4" stroke="#3979e8" strokeWidth="3" />)}
  </svg>;
}

function AnalyticsDashboard() {
  const { auth } = useContext(AuthContext);
  const [range, setRange] = useState("Last 30 days");
  const userRole = auth?.user?.role || "CUSTOMER";
  const selected = userRole === "BUSINESS_CLIENT"
    ? "business"
    : ["ADMINISTRATOR", "LOGISTICS_OPERATOR"].includes(userRole)
      ? "admin"
      : "customer";
  const data = dashboards[selected];
  const percentage = useMemo(() => selected === "customer" ? 88 : selected === "admin" ? 96 : 94.8, [selected]);

  return <div className="analytics-page">
    <section className="analytics-hero">
      <div><p>{data.eyebrow}</p><h1>{data.title}</h1><span>{data.description}</span></div>
      <div className="analytics-controls"><label>Reporting period<select value={range} onChange={(event) => setRange(event.target.value)}><option>Last 7 days</option><option>Last 30 days</option><option>Last quarter</option></select></label><button type="button">Export report <span>↓</span></button></div>
    </section>

    <div className="role-banner"><span>Viewing analytics for</span><strong>{data.label}</strong><i>Role-based access</i></div>

    <section className="metric-row">{data.metrics.map(([label, value, note, tone]) => <article className={`analytics-metric ${tone}`} key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</section>

    <section className="analytics-grid main-grid">
      <article className="analytics-card volume-card"><div className="card-heading"><div><span>Shipment analytics</span><h2>Shipment volume</h2></div><b>+12.4%</b></div><TrendChart /><div className="chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></article>
      <article className="analytics-card status-card"><div className="card-heading"><div><span>Delivery status overview</span><h2>Where shipments stand</h2></div><button className="icon-button" type="button">•••</button></div><div className="status-content"><DonutChart /><div className="legend">{[["Delivered", "61%", "green"], ["In transit", "24%", "blue"], ["Out for delivery", "10%", "amber"], ["Exceptions", "5%", "red"]].map(([label, value, tone]) => <div key={label}><i className={tone}/><span>{label}</span><b>{value}</b></div>)}</div></div></article>
    </section>

    <section className="analytics-grid lower-grid">
      <article className="analytics-card flow-card"><div className="card-heading"><div><span>Shipment monitoring</span><h2>Delivery flow</h2></div><b className="subtle-pill">Live</b></div><div className="flow-track">{flowSteps.map(([step, count], index) => <div className="flow-item" key={step}><div className={`flow-dot ${index === 4 ? "complete" : ""}`}>{index + 1}</div>{index < flowSteps.length - 1 && <div className="flow-line"/>}<strong>{count}</strong><span>{step}</span></div>)}</div><div className="flow-footnote"><span>Flow completion</span><b>{percentage}% <i/></b></div></article>
      <article className="analytics-card insights-card"><div className="card-heading"><div><span>Tracking insights</span><h2>Attention needed</h2></div><a href="#reports">View all</a></div><div className="alert-item"><i className="alert-mark warning">!</i><div><strong>7 shipments may miss their ETA</strong><span>Weather and traffic conditions are affecting delivery routes.</span></div><button type="button">Review</button></div><div className="alert-item"><i className="alert-mark info">↗</i><div><strong>Delivery velocity is improving</strong><span>Average delivery time is 18% faster than last month.</span></div><button type="button">Details</button></div></article>
    </section>

    <section className="feature-area" id="reports"><div className="feature-head"><div><span>Dashboard modules</span><h2>{data.label} capabilities</h2></div><p>Interactive frontend preview · {range}</p></div><div className="module-grid">{data.modules.map((module, index) => <article key={module}><span>0{index + 1}</span><h3>{module}</h3><p>{module === "Notification center" ? "Keep important delivery updates in one clear, timely view." : "Explore performance signals and operational details at a glance."}</p><button type="button">Open module <b>→</b></button></article>)}</div></section>
  </div>;
}

export default AnalyticsDashboard;
