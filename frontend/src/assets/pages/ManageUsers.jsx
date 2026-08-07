import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/auth";
import {
  approveUser,
  getApprovedUsers,
  getPendingUsers,
  getRejectedUsers,
  rejectUser,
} from "../services/api";

const tabs = [
  { id: "pending", label: "Pending", statusLabel: "Pending" },
  { id: "approved", label: "Approved", statusLabel: "Approved" },
  { id: "rejected", label: "Rejected", statusLabel: "Rejected" },
];

const statusClass = {
  pending: "pending",
  approved: "delivered",
  rejected: "failed-delivery",
};

const getUsersByTab = {
  pending: getPendingUsers,
  approved: getApprovedUsers,
  rejected: getRejectedUsers,
};

function ManageUsers() {
  const { users: localUsers } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("pending");
  const [users, setUsers] = useState({
    pending: [],
    approved: [],
    rejected: [],
  });
  const [loading, setLoading] = useState(true);
  const [usingLocalUsers, setUsingLocalUsers] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const activeUsers = users[activeTab];
  const activeStatus = tabs.find((tab) => tab.id === activeTab);

  const totals = useMemo(
    () => ({
      pending: users.pending.length,
      approved: users.approved.length,
      rejected: users.rejected.length,
    }),
    [users],
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const [pending, approved, rejected] = await Promise.all([
        getUsersByTab.pending(),
        getUsersByTab.approved(),
        getUsersByTab.rejected(),
      ]);

      setUsers({
        pending: Array.isArray(pending.data) ? pending.data : [],
        approved: Array.isArray(approved.data) ? approved.data : [],
        rejected: Array.isArray(rejected.data) ? rejected.data : [],
      });

      setUsingLocalUsers(false);

    } catch {

      const fallback = localUsers.map((user, index) => ({
        userId: user.userId || user.id || `local-${index + 1}`,
        firstName: user.firstName || user.name?.split(" ")[0] || "User",
        lastName: user.lastName || user.name?.split(" ").slice(1).join(" ") || "",
        email: user.email,
        role: user.role || "Customer",
        phone: user.phone || "",
        registrationStatus: user.registrationStatus || "APPROVED",
      }));

      setUsers({
        pending: fallback.filter((user) => user.registrationStatus === "PENDING"),
        approved: fallback.filter((user) => user.registrationStatus === "APPROVED"),
        rejected: fallback.filter((user) => user.registrationStatus === "REJECTED"),
      });

      setUsingLocalUsers(true);

      setFeedback({
        type: "success",
        message: "User service is unavailable. Showing local accounts.",
      });

    } finally {
      setLoading(false);
    }

  }, [localUsers]);

  useEffect(() => {
    const fetchUsers = async () => {
      await loadUsers();
    };

    fetchUsers();
  }, [loadUsers]);

  const moveUser = (userId, from, to) => {
    setUsers((current) => {
      const targetUser = current[from].find((user) => user.userId === userId);

      return {
        ...current,
        [from]: current[from].filter((user) => user.userId !== userId),
        [to]: targetUser ? [{ ...targetUser, registrationStatus: to.toUpperCase() }, ...current[to]] : current[to],
      };
    });
  };

  const handleApprove = async (userId) => {

    if (!window.confirm("Are you sure you want to approve this user?")) {
      return;
    }

    if (usingLocalUsers) {
      moveUser(userId, "pending", "approved");
      setFeedback({
        type: "success",
        message: "User approved locally."
      });
      return;
    }

    try {
      await approveUser(userId);
      moveUser(userId, "pending", "approved");

      setFeedback({
        type: "success",
        message: "User approved successfully."
      });

    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to approve user.",
      });
    }
  };

  const handleReject = async (userId) => {

    if (!window.confirm("Are you sure you want to reject this user?")) {
      return;
    }

    if (usingLocalUsers) {
      moveUser(userId, "pending", "rejected");
      setFeedback({
        type: "success",
        message: "User rejected locally."
      });
      return;
    }

    try {
      await rejectUser(userId);
      moveUser(userId, "pending", "rejected");

      setFeedback({
        type: "success",
        message: "User rejected successfully."
      });

    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to reject user."
      });
    }
  };
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">User Management</div>
          <h1>Manage Users</h1>
          <p className="subtle">Review pending registrations and monitor approved or rejected accounts.</p>
        </div>
        <button className="button secondary" onClick={loadUsers} type="button">
          Refresh
        </button>
      </div>

      {feedback.message && <div className={`alert ${feedback.type}`}>{feedback.message}</div>}

      <section className="panel">
        <div className="user-tabs" role="tablist" aria-label="User status">
          {tabs.map((tab) => (
            <button
              className={`user-tab ${activeTab === tab.id ? "active" : ""}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              <span>{tab.label}</span>
              <strong>{totals[tab.id]}</strong>
            </button>
          ))}
        </div>

        <div className="toolbar">
          <div>
            <h2 className="section-title">{activeStatus.statusLabel} Users</h2>
            <p className="subtle">{activeUsers.length} account{activeUsers.length === 1 ? "" : "s"} found</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                {activeTab === "pending" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === "pending" ? 6 : 5}>
                    <div className="empty-state">Loading users...</div>
                  </td>
                </tr>
              ) : activeUsers.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "pending" ? 6 : 5}>
                    <div className="empty-state">No {activeStatus.label.toLowerCase()} users found.</div>
                  </td>
                </tr>
              ) : (
                activeUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <strong>
                        {user.firstName} {user.lastName}
                      </strong>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.phone || "-"}</td>
                    <td>
                      <span className={`badge ${statusClass[activeTab]}`}>{activeStatus.statusLabel}</span>
                    </td>
                    {activeTab === "pending" && (
                      <td>
                        <div className="row-actions">
                          <button className="button primary compact" onClick={() => handleApprove(user.userId)} type="button">
                            Approve
                          </button>
                          <button className="button secondary compact" onClick={() => handleReject(user.userId)} type="button">
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ManageUsers;
