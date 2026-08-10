import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/auth";
import { ShipmentContext } from "../context/shipments";
import { getApprovedUsers, getCustomerDashboardAnalytics, getNotifications } from "../services/api";
import "./Dashboard.css";
import "./CustomerDashboard.css";

const roleLabels = {
  CUSTOMER: "Customer",
  BUSINESS_CLIENT: "Business Client",
  LOGISTICS_OPERATOR: "Logistics Operator",
  SUPPORT_AGENT: "Support Agent",
  ADMINISTRATOR: "Administrator",
};

const statusTone = {
  Created: "neutral",
  "Picked Up": "info",
  "In Transit": "info",
  "Out for Delivery": "warning",
  Delivered: "success",
  "Failed Delivery": "danger",
  Cancelled: "danger",
};

const normalizeRole = (role) => roleLabels[role] || role || "Customer";

const actionLinks = {
  create: { label: "Create Shipment", to: "/shipments/new" },
  request: { label: "Request Shipment", to: "/shipments/new" },
  manage: { label: "Manage Shipments", to: "/shipments" },
  track: { label: "Track Shipments", to: "/track" },
  users: { label: "Manage Users", to: "/users/manage" },
};

function StatCard({ label, value, detail, tone = "default" }) {
  return (
    <article className={`dashboard-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function roleCount(users, roleNames) {
  const normalizedRoles = new Set(roleNames);

  return users.filter((user) => normalizedRoles.has(normalizeRole(user.role))).length;
}

function getDashboardData(shipments, metrics, users, notifications) {
  const activeShipments = shipments.filter(
    (shipment) => !["Delivered", "Cancelled"].includes(shipment.status),
  );
  const delayedShipments = shipments.filter((shipment) => shipment.status === "Failed Delivery");
  const criticalShipments = shipments.filter((shipment) => shipment.priority === "Critical");
  const latestShipments = shipments.slice(0, 6);
  const avgProgress = shipments.length
    ? Math.round(shipments.reduce((total, shipment) => total + shipment.progress, 0) / shipments.length)
    : 0;

  const statusSummary = shipments.reduce((summary, shipment) => {
    summary[shipment.status] = (summary[shipment.status] || 0) + 1;
    return summary;
  }, {});

  return {
    activeShipments,
    avgProgress,
    criticalShipments,
    delayedShipments,
    latestShipments,
    metrics,
    roleTotals: {
      admins: roleCount(users, ["Administrator"]),
      operators: roleCount(users, ["Logistics Operator"]),
      businessClients: roleCount(users, ["Business Client"]),
      customers: roleCount(users, ["Customer"]),
    },
    shipments,
    statusSummary,
    users,
    notifications,
  };
}

function DashboardHero({ actions, subtitle, title }) {
  return (
    <section className="dashboard-hero">
      <div>
        <p className="dashboard-kicker">ShipTrack Pro Control Center</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="dashboard-actions">
        {actions.map((action) => (
          <Link className="dashboard-action" key={action.label} to={action.to}>
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function MetricsStrip({ data }) {
  const deliveryRate = `${data.metrics.deliveryRate}%`;

  return (
    <section className="dashboard-grid stats-grid" aria-label="Dashboard metrics">
      <StatCard label="Total Shipments" value={data.metrics.total} detail="Shipment records in platform" />
      <StatCard label="Active Shipments" value={data.metrics.active} detail="Created to out-for-delivery" tone="info" />
      <StatCard label="Delivered" value={data.metrics.delivered} detail={`${deliveryRate} delivery completion`} tone="success" />
      <StatCard label="Delayed" value={data.metrics.delayed} detail="Failed delivery exceptions" tone="danger" />
    </section>
  );
}

function ControlScope({ groups, title = "Control Scope" }) {
  if (!groups.length) return null;

  return (
    <article className="dashboard-panel">
      <div className="panel-header compact">
        <h2>{title}</h2>
      </div>
      <div className="control-grid">
        {groups.map((group) => (
          <div className="control-card" key={group.label}>
            <span>{group.label}</span>
            <strong>{group.count}</strong>
            <p>{group.description}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function PermissionPanel({ permissions, title }) {
  return (
    <article className="dashboard-panel">
      <div className="panel-header compact">
        <h2>{title}</h2>
      </div>
      <ul className="permission-list">
        {permissions.map((permission) => (
          <li key={permission}>{permission}</li>
        ))}
      </ul>
    </article>
  );
}

function ShipmentOperations({ data }) {
  return (
    <article className="dashboard-panel route-panel">
      <div className="panel-header">
        <div>
          <h2>Shipment Operations</h2>
          <p>Live route visibility, status tracking, ETA watch, and shipment progress.</p>
        </div>
        <span className="status-pill info">{data.activeShipments.length} live</span>
      </div>

      <div className="route-map" aria-hidden="true">
        <span className="route-line one" />
        <span className="route-line two" />
        {data.activeShipments.slice(0, 5).map((shipment, index) => (
          <span
            className={`route-node ${shipment.priority === "Critical" ? "critical" : ""}`}
            key={shipment.trackingNumber}
            style={{
              left: `${16 + index * 17}%`,
              top: `${28 + (index % 3) * 18}%`,
            }}
          />
        ))}
      </div>

      <div className="insight-row">
        <div>
          <span>Average Progress</span>
          <strong>{data.avgProgress}%</strong>
        </div>
        <div>
          <span>Critical Loads</span>
          <strong>{data.criticalShipments.length}</strong>
        </div>
        <div>
          <span>ETA Watch</span>
          <strong>{data.delayedShipments.length + data.criticalShipments.length}</strong>
        </div>
      </div>
    </article>
  );
}

function StatusOverview({ data }) {
  return (
    <article className="dashboard-panel">
      <div className="panel-header compact">
        <h2>Delivery Status Overview</h2>
      </div>
      <div className="status-bars">
        {Object.entries(data.statusSummary).map(([status, count]) => (
          <div className="status-row" key={status}>
            <div>
              <span>{status}</span>
              <small>{count} shipment{count === 1 ? "" : "s"}</small>
            </div>
            <div className="status-track">
              <span style={{ width: `${Math.max(10, (count / Math.max(data.metrics.total, 1)) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function NotificationPanel({ items, title = "Notification Center" }) {
  return (
    <article className="dashboard-panel">
      <div className="panel-header compact">
        <h2>{title}</h2>
      </div>
      <div className="notification-list">
        {items.length === 0 && <p>No notifications available.</p>}
        {items.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </article>
  );
}

function ShipmentTable({ data, title = "Shipment Visibility Dashboard" }) {
  return (
    <article className="dashboard-panel shipment-panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>Tracking number, route, package, status, ETA, and progress.</p>
        </div>
        <Link className="text-link" to="/shipments">
          View all
        </Link>
      </div>

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Route</th>
              <th>Package</th>
              <th>Status</th>
              <th>ETA</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {data.latestShipments.map((shipment) => (
              <tr key={shipment.id}>
                <td>{shipment.trackingNumber}</td>
                <td>
                  {shipment.senderCity} to {shipment.receiverCity}
                </td>
                <td>{shipment.packageType}</td>
                <td>
                  <span className={`status-pill ${statusTone[shipment.status] || "neutral"}`}>
                    {shipment.status}
                  </span>
                </td>
                <td>{shipment.eta}</td>
                <td>{shipment.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function ReportsPanel({ items }) {
  return (
    <article className="dashboard-panel">
      <div className="panel-header compact">
        <h2>Analytics & Reports</h2>
      </div>
      <div className="report-list">
        {items.map((item) => (
          <div key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function SnapshotPanel({ data, role }) {
  return (
    <aside className="dashboard-panel side-panel">
      <div className="panel-header compact">
        <h2>System Snapshot</h2>
      </div>
      <div className="snapshot-list">
        <div>
          <span>Registered Users</span>
          <strong>{data.users.length}</strong>
        </div>
        <div>
          <span>Role</span>
          <strong>{role}</strong>
        </div>
        <div>
          <span>Proof of Delivery</span>
          <strong>{data.metrics.delivered}</strong>
        </div>
        <div>
          <span>Route Records</span>
          <strong>{data.shipments.length}</strong>
        </div>
      </div>
    </aside>
  );
}

function BusinessClientInsights({ data }) {
  const total = Math.max(data.metrics.total, 1);
  const delivered = data.shipments.filter((shipment) => shipment.status === "Delivered");
  const onTimeDeliveries = delivered.filter((shipment) => {
    const deliveredAt = shipment.history?.find((event) => event.status === "Delivered")?.timestamp;
    return deliveredAt && shipment.eta && new Date(deliveredAt) <= new Date(`${shipment.eta}T23:59:59`);
  }).length;
  const packageMix = Object.entries(
    data.shipments.reduce((counts, shipment) => {
      counts[shipment.packageType] = (counts[shipment.packageType] || 0) + 1;
      return counts;
    }, {}),
  ).sort(([, left], [, right]) => right - left).slice(0, 3);
  const routes = Object.entries(
    data.shipments.reduce((counts, shipment) => {
      const route = `${shipment.senderCity} → ${shipment.receiverCity}`;
      counts[route] = (counts[route] || 0) + 1;
      return counts;
    }, {}),
  ).sort(([, left], [, right]) => right - left);
  const customerAccounts = new Set(data.shipments.map((shipment) => shipment.senderName)).size;
  const pendingRequests = data.shipments.filter((shipment) => shipment.status === "Pending Approval").length;

  return (
    <section className="business-insights" aria-label="Business performance insights">
      <article className="dashboard-panel insight-card">
        <div className="panel-header compact"><h2>Shipment analytics</h2></div>
        <div className="insight-metrics">
          <div><span>Total volume</span><strong>{data.metrics.total}</strong></div>
          <div><span>Average progress</span><strong>{data.avgProgress}%</strong></div>
        </div>
        <div className="insight-list">{packageMix.map(([type, count]) => <div key={type}><span>{type}</span><strong>{count} shipments</strong></div>)}</div>
      </article>

      <article className="dashboard-panel insight-card">
        <div className="panel-header compact"><h2>Delivery performance</h2></div>
        <div className="insight-metrics">
          <div><span>Completion rate</span><strong>{data.metrics.deliveryRate}%</strong></div>
          <div><span>On-time deliveries</span><strong>{onTimeDeliveries}/{delivered.length}</strong></div>
        </div>
        <p className="insight-copy">{delivered.length ? "Completed deliveries are measured against their promised ETA." : "Delivery performance will appear when shipments are completed."}</p>
      </article>

      <article className="dashboard-panel insight-card">
        <div className="panel-header compact"><h2>Delay analysis</h2></div>
        <div className="insight-metrics">
          <div><span>Delay exceptions</span><strong>{data.delayedShipments.length}</strong></div>
          <div><span>Critical loads</span><strong>{data.criticalShipments.length}</strong></div>
        </div>
        <div className="insight-list"><div><span>Exception rate</span><strong>{Math.round((data.delayedShipments.length / total) * 100)}%</strong></div><div><span>ETA watchlist</span><strong>{data.delayedShipments.length + data.criticalShipments.length} shipments</strong></div></div>
      </article>

      <article className="dashboard-panel insight-card">
        <div className="panel-header compact"><h2>Logistics overview</h2></div>
        <div className="insight-metrics">
          <div><span>Active shipments</span><strong>{data.activeShipments.length}</strong></div>
          <div><span>Live routes</span><strong>{routes.length}</strong></div>
        </div>
        <div className="insight-list">{routes.slice(0, 2).map(([route, count]) => <div key={route}><span>{route}</span><strong>{count} shipment{count === 1 ? "" : "s"}</strong></div>)}</div>
      </article>

      <article className="dashboard-panel insight-card">
        <div className="panel-header compact"><h2>Customer activity</h2></div>
        <div className="insight-metrics">
          <div><span>Customer accounts</span><strong>{customerAccounts}</strong></div>
          <div><span>Pending requests</span><strong>{pendingRequests}</strong></div>
        </div>
        <div className="insight-list"><div><span>Active deliveries</span><strong>{data.activeShipments.length}</strong></div><div><span>Completed history</span><strong>{delivered.length} deliveries</strong></div></div>
      </article>
    </section>
  );
}

function DashboardLayout({
  actions,
  controlGroups,
  data,
  notifications,
  permissions,
  reports,
  role,
  insights,
  subtitle,
  tableTitle,
  title,
}) {
  return (
    <div className="dashboard">
      <DashboardHero actions={actions} subtitle={subtitle} title={title} />
      <MetricsStrip data={data} />
      {insights}

      <section className="dashboard-grid main-grid">
        <ShipmentOperations data={data} />
        <PermissionPanel permissions={permissions} title={`${role} Permissions`} />
      </section>

      <section className={`dashboard-grid ${controlGroups.length ? "role-grid" : "single-grid"}`}>
        <ControlScope groups={controlGroups} />
        <StatusOverview data={data} />
      </section>

      <section className="dashboard-grid analytics-grid">
        <ReportsPanel items={reports} />
        <NotificationPanel items={data.notifications.length ? data.notifications : notifications} />
        <SnapshotPanel data={data} role={role} />
      </section>

      <section className="dashboard-grid table-grid">
        <ShipmentTable data={data} title={tableTitle} />
      </section>
    </div>
  );
}

function AdministratorDashboard({ data }) {
  return (
    <DashboardLayout
      actions={[actionLinks.users, actionLinks.create, actionLinks.manage, actionLinks.track]}
      controlGroups={[
        {
          count: data.roleTotals.operators,
          description: "Manage operator assignments, workload, and shipment updates.",
          label: "Operators",
        },
        {
          count: data.roleTotals.businessClients,
          description: "Manage business client accounts, shipment activity, and approvals.",
          label: "Business Clients",
        },
        {
          count: data.roleTotals.customers,
          description: "Manage customer accounts, shipment requests, and tracking support.",
          label: "Customers",
        },
      ]}
      data={data}
      notifications={[
        "Operator workload and delayed shipment alerts.",
        "Business client and customer activity review.",
        "Shipment creation, management, and tracking exceptions.",
      ]}
      permissions={[
        "Control operators, business clients, and customers.",
        "Create shipments for operations and client workflows.",
        "Manage shipment lifecycle status, routes, and delivery exceptions.",
        "Track all shipments handled by the organization.",
      ]}
      reports={[
        { title: "User management", description: "Operators, business clients, and customers under admin control." },
        { title: "Delivery analytics", description: "Delivery rate, delay analysis, and shipment monitoring." },
        { title: "Route performance", description: "Route progress, ETA changes, and exception trends." },
      ]}
      role="Administrator"
      subtitle="Operational control for operators, business clients, customers, shipment creation, management, and tracking."
      tableTitle="Organization Shipments"
      title="Administrator Dashboard"
    />
  );
}

function BusinessClientDashboard({ data }) {
  return (
    <DashboardLayout
      actions={[actionLinks.create, actionLinks.manage, actionLinks.track]}
      controlGroups={[
        {
          count: data.roleTotals.customers,
          description: "Manage customer shipment requests, tracking visibility, and delivery activity.",
          label: "Customers",
        },
      ]}
      data={data}
      insights={<BusinessClientInsights data={data} />}
      notifications={[
        "Customer shipment requests waiting for processing.",
        "Delivery alerts and delay warnings for business shipments.",
        "Tracking updates ready for customer communication.",
      ]}
      permissions={[
        "Control customers attached to the business account.",
        "Create shipments for customer and business delivery needs.",
        "Manage shipment details, status, and route progress.",
        "Track all business and customer shipments.",
      ]}
      reports={[
        { title: "Customer activity", description: "Customer shipment requests, active deliveries, and history." },
        { title: "Delivery performance", description: "Delivery completion, delays, and ETA performance." },
        { title: "Shipment analytics", description: "Business shipment volume, package type, and route trends." },
        { title: "Delay analysis", description: "Exception rate, critical loads, and shipments needing ETA attention." },
        { title: "Logistics overview", description: "Active routes, shipment progress, and current delivery workload." },
      ]}
      role="Business Client"
      subtitle="Business-level control for customers, shipment creation, shipment management, and tracking."
      tableTitle="Business Shipments"
      title="Business Client Dashboard"
    />
  );
}

function LogisticsOperatorDashboard({ data }) {
  return (
    <DashboardLayout
      actions={[actionLinks.create, actionLinks.manage, actionLinks.track]}
      controlGroups={[
        {
          count: data.activeShipments.length,
          description: "Manage live shipment queues, delivery status updates, and route progress.",
          label: "Active Operations",
        },
      ]}
      data={data}
      notifications={[
        "Live shipment status updates requiring attention.",
        "Critical package and ETA watch alerts.",
        "Route progress, driver tracking, and delivery exception reminders.",
      ]}
      permissions={[
        "Create shipments for logistics workflows.",
        "Manage shipment lifecycle status and route updates.",
        "Track active shipments, ETAs, and delivery progress.",
        "Monitor proof of delivery readiness.",
      ]}
      reports={[
        { title: "Route history", description: "Pickup, transit, delivery route, and status timelines." },
        { title: "ETA prediction", description: "Delivery estimates, delay prediction, and route performance." },
        { title: "Delivery monitoring", description: "Driver tracking, live location, and status notifications." },
      ]}
      role="Logistics Operator"
      subtitle="Shipment execution dashboard for creating, managing, and tracking delivery operations."
      tableTitle="Operator Shipment Queue"
      title="Logistics Operator Dashboard"
    />
  );
}

/* ============================================================
   Customer Dashboard — purpose-built, shows only the
   authenticated customer's own data.
   ============================================================ */

function cdBadgeClass(status) {
  const s = String(status).toLowerCase().replace(/\s+/g, "-");
  return `cdb-badge ${s}`;
}

function CustomerDashboard() {
  const { auth } = useContext(AuthContext);
  const { shipments, loading, error } = useContext(ShipmentContext);

  // Derive display name from auth context (real name from backend login)
  const firstName = auth?.user?.firstName;
  const fullName  = auth?.user?.name || (firstName
    ? `${firstName} ${auth?.user?.lastName || ""}`.trim()
    : null);
  const displayName = fullName || auth?.user?.email || "Customer";

  // Backend-provided metrics scoped to this customer
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(null);

  // Notifications scoped to this customer
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      // Load customer metrics
      setMetricsLoading(true);
      try {
        const res = await getCustomerDashboardAnalytics();
        if (active) setMetrics(res.data);
      } catch {
        if (active) setMetricsError("Could not load dashboard metrics.");
      } finally {
        if (active) setMetricsLoading(false);
      }

      // Load notifications
      try {
        const nRes = await getNotifications();
        if (active) setNotifications(nRes.data ?? []);
      } catch {
        if (active) setNotifications([]);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  // Recent 5 shipments (already scoped by backend to this customer)
  const recentShipments = useMemo(() => shipments.slice(0, 5), [shipments]);

  const hasShipments = shipments.length > 0;

  return (
    <div className="dashboard">
      {/* ----- Hero / Welcome Banner ----- */}
      <section className="cdb-hero">
        <div className="cdb-hero-text">
          <h1>Welcome back, {displayName} 👋</h1>
          <p>Track your shipments and stay updated on every delivery.</p>
        </div>
        <div className="cdb-hero-actions">
          <Link className="cdb-hero-btn-primary cdb-hero-actions a" to="/shipments/my">
            My Shipments
          </Link>
          <Link className="cdb-hero-btn-secondary cdb-hero-actions a" to="/track">
            Track a Shipment
          </Link>
          <Link className="cdb-hero-btn-secondary cdb-hero-actions a" to="/shipments/new">
            + Create Shipment
          </Link>
        </div>
      </section>

      {/* ----- Metrics Strip (backend-scoped to this customer) ----- */}
      {metricsLoading && <div className="cdb-loading">Loading your shipment summary…</div>}
      {metricsError  && <div className="cdb-error">{metricsError}</div>}

      {metrics && (
        <section className="cdb-stats-grid" aria-label="My shipment summary">
          <div className="cdb-stat-card info">
            <div className="cdb-stat-label">Active Shipments</div>
            <div className="cdb-stat-value">{metrics.activeShipments ?? 0}</div>
          </div>
          <div className="cdb-stat-card">
            <div className="cdb-stat-label">Total Shipments</div>
            <div className="cdb-stat-value">{metrics.totalShipments ?? 0}</div>
          </div>
          <div className="cdb-stat-card success">
            <div className="cdb-stat-label">Delivered</div>
            <div className="cdb-stat-value">{metrics.deliveredShipments ?? 0}</div>
          </div>
          <div className="cdb-stat-card warning">
            <div className="cdb-stat-label">In Progress</div>
            <div className="cdb-stat-value">{metrics.pendingShipments ?? 0}</div>
          </div>
          <div className="cdb-stat-card danger">
            <div className="cdb-stat-label">Failed / Cancelled</div>
            <div className="cdb-stat-value">
              {(metrics.failedShipments ?? 0) + (metrics.cancelledShipments ?? 0)}
            </div>
          </div>
        </section>
      )}

      {/* ----- Quick Actions ----- */}
      <section className="cdb-panel" aria-label="Quick actions">
        <div className="cdb-panel-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="cdb-actions-grid">
          <Link className="cdb-action-card" to="/track">
            <span className="cdb-action-icon">🔍</span>
            <span>Track Shipment</span>
          </Link>
          <Link className="cdb-action-card" to="/shipments/my">
            <span className="cdb-action-icon">📦</span>
            <span>My Shipments</span>
          </Link>
          <Link className="cdb-action-card" to="/shipments/new">
            <span className="cdb-action-icon">➕</span>
            <span>Create Shipment</span>
          </Link>
          <Link className="cdb-action-card" to="/profile">
            <span className="cdb-action-icon">👤</span>
            <span>My Profile</span>
          </Link>
        </div>
      </section>

      {/* ----- My Active Shipments ----- */}
      <section className="cdb-panel" aria-label="My recent shipments">
        <div className="cdb-panel-header">
          <h2>My Active Shipments</h2>
          {hasShipments && <Link to="/shipments/my">View all →</Link>}
        </div>

        {error   && <div className="cdb-error">{error}</div>}
        {loading && <div className="cdb-loading">Loading your shipments…</div>}

        {!loading && !error && !hasShipments && (
          <div className="cdb-empty">
            <div className="cdb-empty-icon">📭</div>
            <h3>No shipments yet</h3>
            <p>Create your first shipment to start tracking your delivery.</p>
            <Link to="/shipments/new">Create Shipment</Link>
          </div>
        )}

        {!loading && !error && hasShipments && (
          <div className="cdb-table-wrap">
            <table className="cdb-table">
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>ETA</th>
                  <th>Progress</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentShipments.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.trackingNumber}</strong></td>
                    <td>
                      <span>{s.senderCity || "—"}</span>
                      <span style={{ margin: "0 4px", color: "#6b7f99" }}>→</span>
                      <span>{s.receiverCity || "—"}</span>
                    </td>
                    <td>
                      <span className={cdBadgeClass(s.status)}>{s.status}</span>
                    </td>
                    <td>{s.eta || "—"}</td>
                    <td>
                      <div className="cdb-progress-track">
                        <div
                          className="cdb-progress-fill"
                          style={{ width: `${Number(s.progress || 0)}%` }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7f99", marginTop: 3 }}>
                        {s.progress}%
                      </div>
                    </td>
                    <td>
                      <Link
                        className="button secondary compact"
                        to={`/track?tracking=${encodeURIComponent(s.trackingNumber)}`}
                      >
                        Track
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ----- Notifications ----- */}
      <section className="cdb-panel" aria-label="Notifications">
        <div className="cdb-panel-header">
          <h2>Recent Notifications</h2>
        </div>
        {notifications.length === 0 ? (
          <p style={{ color: "#6b7f99", fontSize: "0.875rem", margin: 0 }}>
            No notifications yet.
          </p>
        ) : (
          <div className="cdb-notif-list">
            {notifications.slice(0, 6).map((n, i) => (
              <div className="cdb-notif-item" key={n.notificationId ?? i}>
                <div className={`cdb-notif-dot ${n.isRead ? "" : "unread"}`} />
                <div>
                  <div className="cdb-notif-text">{n.message || n.title || "Shipment notification"}</div>
                  {n.createdAt && (
                    <div className="cdb-notif-time">
                      {new Date(n.createdAt).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SupportAgentDashboard({ data }) {
  return (
    <DashboardLayout
      actions={[actionLinks.track, actionLinks.manage]}
      controlGroups={[
        {
          count: data.roleTotals.customers,
          description: "Support customer tracking issues, delay questions, and delivery visibility.",
          label: "Customer Support",
        },
      ]}
      data={data}
      notifications={[
        "Customer tracking issues and delay warnings.",
        "Shipment search activity and support follow-up.",
        "Proof of delivery verification questions.",
      ]}
      permissions={[
        "Search and track shipments for customer support.",
        "Review tracking history and delivery status.",
        "Assist customers with ETA, delay, and proof of delivery questions.",
      ]}
      reports={[
        { title: "Support activity", description: "Customer queries, tracking history, and issue follow-up." },
        { title: "Delay warnings", description: "Failed delivery and delayed shipment support signals." },
        { title: "Notification review", description: "Delivery alerts, ETA messages, and customer communication." },
      ]}
      role="Support Agent"
      subtitle="Customer support dashboard for shipment search, tracking history, and delivery issue follow-up."
      tableTitle="Support Shipment View"
      title="Support Agent Dashboard"
    />
  );
}

function Dashboard() {
  const { auth, users = [] } = useContext(AuthContext);
  const { metrics, shipments } = useContext(ShipmentContext);
  const role = normalizeRole(auth?.user?.role);
  const [dashboardUsers, setDashboardUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let active = true;
    const loadDashboardData = async () => {
      try {
        const notificationResponse = await getNotifications();
        if (active) {
          setNotifications(notificationResponse.data.map((notification) =>
            notification.message || notification.title || "Shipment notification"));
        }
      } catch {
        if (active) setNotifications([]);
      }

      if (role !== "Administrator") {
        if (active) setDashboardUsers([]);
        return;
      }

      try {
        const userResponse = await getApprovedUsers();
        if (active) setDashboardUsers(userResponse.data);
      } catch {
        if (active) setDashboardUsers([]);
      }
    };

    loadDashboardData();
    return () => { active = false; };
  }, [role]);

  const data = useMemo(() => getDashboardData(
    shipments,
    metrics,
    role === "Administrator" ? dashboardUsers : users,
    notifications,
  ), [dashboardUsers, metrics, notifications, role, shipments, users]);

  if (role === "Administrator") return <AdministratorDashboard data={data} />;
  if (role === "Business Client") return <BusinessClientDashboard data={data} />;
  if (role === "Logistics Operator") return <LogisticsOperatorDashboard data={data} />;
  if (role === "Support Agent") return <SupportAgentDashboard data={data} />;
  // Customer gets its own self-contained dashboard (no shared data prop needed)
  return <CustomerDashboard />;
}

export default Dashboard;
