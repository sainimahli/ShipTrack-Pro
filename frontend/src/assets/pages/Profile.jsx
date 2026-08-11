import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/auth";
import { getNotifications, getProfile, updateProfile } from "../services/api";

const roleLabels = {
  CUSTOMER: "Customer",
  BUSINESS_CLIENT: "Business Client",
  LOGISTICS_OPERATOR: "Logistics Operator",
  SUPPORT_AGENT: "Support Agent",
  ADMINISTRATOR: "Administrator",
};

const normalizeRole = (role) => roleLabels[role] || role || "Customer";

const formatActivityTime = (value) => {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : date.toLocaleString("en-IN");
};

function Profile() {
  const { capabilities, updateAuthenticatedUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [activities, setActivities] = useState([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getProfile();
      const currentProfile = response.data;
      setProfile(currentProfile);
      setForm({
        firstName: currentProfile.firstName || "",
        lastName: currentProfile.lastName || "",
        phone: currentProfile.phone || "",
      });
      updateAuthenticatedUser(currentProfile);
    } catch {
      setFeedback({ type: "error", message: "Your profile could not be loaded. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }, [updateAuthenticatedUser]);

  useEffect(() => {
    const requestTimer = window.setTimeout(() => { void loadProfile(); }, 0);
    return () => window.clearTimeout(requestTimer);
  }, [loadProfile]);

  useEffect(() => {
    let active = true;
    getNotifications()
      .then(({ data }) => {
        if (active) setActivities(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setActivityError("Unable to load account activity.");
      })
      .finally(() => {
        if (active) setIsActivityLoading(false);
      });

    return () => { active = false; };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback({ type: "", message: "" });
    try {
      await updateProfile(form);
      const updatedProfile = { ...profile, ...form };
      setProfile(updatedProfile);
      updateAuthenticatedUser(updatedProfile);
      setIsEditing(false);
      setFeedback({ type: "success", message: "Profile updated successfully." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Profile could not be updated. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      phone: profile?.phone || "",
    });
    setFeedback({ type: "", message: "" });
    setIsEditing(false);
  };

  const role = normalizeRole(profile?.role);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">Account settings</div>
          <h1>Profile management</h1>
          <p className="subtle">Manage your account details and review your role-based access.</p>
        </div>
      </div>

      {feedback.message && <p className={`form-feedback ${feedback.type}`}>{feedback.message}</p>}

      {isLoading ? (
        <section className="panel"><p className="subtle">Loading your profile...</p></section>
      ) : profile && (
        <section className="grid grid-2">
          <form className="panel profile-card" onSubmit={handleSave}>
            <div className="panel-header compact">
              <div className="profile-identity">
                <div className="profile-monogram" aria-hidden="true">
                  {`${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}` || "U"}
                </div>
                <div>
                  <div className="profile-card-kicker">Personal account</div>
                  <h2 className="section-title">{`${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Your profile"}</h2>
                  <p className="subtle">Your personal information is only visible to you.</p>
                </div>
              </div>
              {!isEditing && (
                <button className="button secondary" onClick={() => setIsEditing(true)} type="button">
                  Edit profile
                </button>
              )}
            </div>

            <div className="profile-form-grid form-grid">
              <label>
                First name
                <input disabled={!isEditing} name="firstName" onChange={handleChange} value={form.firstName} />
              </label>
              <label>
                Last name
                <input disabled={!isEditing} name="lastName" onChange={handleChange} value={form.lastName} />
              </label>
              <label>
                Email
                <input disabled value={profile.email || ""} />
              </label>
              <label>
                Phone
                <input disabled={!isEditing} name="phone" onChange={handleChange} value={form.phone} />
              </label>
              <label>
                Role
                <input disabled value={role} />
              </label>
              <label>
                Account status
                <input disabled value={profile.registrationStatus || "Active"} />
              </label>
            </div>

            {isEditing && (
              <div className="form-actions">
                <button className="button primary" disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
                <button className="button secondary" disabled={isSaving} onClick={handleCancel} type="button">
                  Cancel
                </button>
              </div>
            )}
          </form>

          <div className="panel">
            <h2 className="section-title">Role capabilities</h2>
            <p className="subtle">Permissions assigned to your {role} account.</p>
            <div className="workflow-list">
              {capabilities.length ? capabilities.map((capability, index) => (
                <div className="workflow-step" key={capability}>
                  <div className="step-number">{index + 1}</div>
                  <div><strong>{capability}</strong></div>
                </div>
              )) : <p className="subtle">No additional capabilities are configured for this role.</p>}
            </div>
          </div>

          <div className="panel">
            <h2 className="section-title">Account activity</h2>
            {isActivityLoading && <p className="subtle">Loading account activity...</p>}
            {activityError && <p className="form-feedback error">{activityError}</p>}
            {!isActivityLoading && !activityError && activities.length === 0 && (
              <p className="subtle">No account activity is available yet.</p>
            )}
            {!isActivityLoading && activities.length > 0 && (
              <div className="workflow-list">
                {activities.map((activity) => (
                  <div className="workflow-step" key={activity.notificationId}>
                    <div className="step-number">•</div>
                    <div>
                      <strong>{activity.title || activity.eventType || "Account update"}</strong>
                      <p className="subtle" style={{ margin: "4px 0 0" }}>{activity.message || "No additional details available."}</p>
                      <small className="subtle">{formatActivityTime(activity.createdAt)}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default Profile;
