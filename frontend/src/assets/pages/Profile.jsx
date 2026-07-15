import { useContext } from "react";
import { AuthContext } from "../context/auth";

const roleLabels = {
  CUSTOMER: "Customer",
  BUSINESS_CLIENT: "Business Client",
  LOGISTICS_OPERATOR: "Logistics Operator",
  SUPPORT_AGENT: "Support Agent",
  ADMINISTRATOR: "Administrator",
  SUPER_ADMIN: "Super Admin",
};

const controlledRoles = {
  "Super Admin": ["Administrator", "Logistics Operator", "Business Client", "Customer"],
  Administrator: ["Logistics Operator", "Business Client", "Customer"],
  "Business Client": ["Customer"],
};

const normalizeRole = (role) => roleLabels[role] || role || "Customer";

function Profile() {
  const { auth, capabilities, users } = useContext(AuthContext);
  const role = normalizeRole(auth.user.role);
  const visibleRoles = controlledRoles[role] || [];
  const controlledUsers = users.filter((user) => visibleRoles.includes(normalizeRole(user.role)));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Authentication and RBAC</div>
          <h1>Profile management</h1>
          <p className="subtle">Review the active JWT-style session and role permissions.</p>
        </div>
      </div>

      <section className="grid grid-2">
        <div className="panel">
          <h2 className="section-title">Account</h2>
          <div className="workflow-list">
            <div className="schema-box">
              <strong>Name</strong>
              <p className="subtle" style={{ margin: "6px 0 0" }}>
                {auth.user.name}
              </p>
            </div>
            <div className="schema-box">
              <strong>Email</strong>
              <p className="subtle" style={{ margin: "6px 0 0" }}>
                {auth.user.email}
              </p>
            </div>
            <div className="schema-box">
              <strong>Company</strong>
              <p className="subtle" style={{ margin: "6px 0 0" }}>
                {auth.user.company}
              </p>
            </div>
            <div className="schema-box">
              <strong>Role</strong>
              <p className="subtle" style={{ margin: "6px 0 0" }}>
                {role}
              </p>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="section-title">Session</h2>
          <div className="schema-box" style={{ wordBreak: "break-all" }}>
            <strong>JWT preview</strong>
            <p className="subtle" style={{ margin: "8px 0 0" }}>
              {auth.token}
            </p>
          </div>

          <h2 className="section-title" style={{ marginTop: 20 }}>
            Role Capabilities
          </h2>
          <div className="workflow-list">
            {capabilities.map((capability, index) => (
              <div className="workflow-step" key={capability}>
                <div className="step-number">{index + 1}</div>
                <div>
                  <strong>{capability}</strong>
                  <p className="subtle" style={{ margin: "4px 0 0" }}>
                    Permission mapped for {role}.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {visibleRoles.length > 0 && (
        <section className="panel" style={{ marginTop: 18 }}>
          <h2 className="section-title">Controlled Users</h2>
          <p className="subtle" style={{ marginTop: -8 }}>
            {role} controls {visibleRoles.join(", ")} accounts.
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Company</th>
                </tr>
              </thead>
              <tbody>
                {controlledUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.company}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default Profile;
