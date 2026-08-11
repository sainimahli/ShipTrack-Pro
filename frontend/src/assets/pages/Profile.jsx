import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/auth";
import {
  getProfile,
  updateProfile,
  getAccountActivity,
} from "../services/api";

const roleLabels = {
  CUSTOMER: "Customer",
  BUSINESS_CLIENT: "Business Client",
  LOGISTICS_OPERATOR: "Logistics Operator",
  SUPPORT_AGENT: "Support Agent",
  ADMINISTRATOR: "Administrator",
};

const normalizeRole = (role) => roleLabels[role] || role || "Customer";

function Profile() {
  const { capabilities, updateAuthenticatedUser } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [activities, setActivities] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
  });

  const loadProfile = useCallback(async () => {
    setIsLoading(true);

    try {
      const [profileResponse, activityResponse] = await Promise.all([
        getProfile(),
        getAccountActivity(),
      ]);

      const currentProfile = profileResponse.data;

      setProfile(currentProfile);

      setForm({
        firstName: currentProfile.firstName || "",
        lastName: currentProfile.lastName || "",
        phone: currentProfile.phone || "",
      });

      setActivities(activityResponse.data || []);

      updateAuthenticatedUser(currentProfile);
    } catch (error) {
      console.error("Failed to load profile/activity:", error);

      setFeedback({
        type: "error",
        message: "Your profile could not be loaded. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateAuthenticatedUser]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setIsSaving(true);

    setFeedback({
      type: "",
      message: "",
    });

    try {
      await updateProfile(form);

      const updatedProfile = {
        ...profile,
        ...form,
      };

      setProfile(updatedProfile);

      updateAuthenticatedUser(updatedProfile);

      setIsEditing(false);

      setFeedback({
        type: "success",
        message: "Profile updated successfully.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
            error.response?.data?.message ||
            "Profile could not be updated. Please try again.",
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

    setFeedback({
      type: "",
      message: "",
    });

    setIsEditing(false);
  };

  const role = normalizeRole(profile?.role);

  return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="eyebrow">Account settings</div>

            <h1>Profile management</h1>

            <p className="subtle">
              Manage your account details and review your role-based access.
            </p>
          </div>
        </div>

        {feedback.message && (
            <p className={`form-feedback ${feedback.type}`}>
              {feedback.message}
            </p>
        )}

        {isLoading ? (
            <section className="panel">
              <p className="subtle">Loading your profile...</p>
            </section>
        ) : profile ? (
            <section className="grid grid-2">

              {/* PROFILE INFORMATION */}
              <form
                  className="panel profile-card"
                  onSubmit={handleSave}
              >
                <div className="panel-header compact">

                  <div className="profile-identity">

                    <div
                        className="profile-monogram"
                        aria-hidden="true"
                    >
                      {`${profile.firstName?.[0] || ""}${
                          profile.lastName?.[0] || ""
                      }` || "U"}
                    </div>

                    <div>
                      <div className="profile-card-kicker">
                        Personal account
                      </div>

                      <h2 className="section-title">
                        {`${profile.firstName || ""} ${
                            profile.lastName || ""
                        }`.trim() || "Your profile"}
                      </h2>

                      <p className="subtle">
                        Your personal information is only visible to you.
                      </p>
                    </div>

                  </div>

                  {!isEditing && (
                      <button
                          className="button secondary"
                          onClick={() => setIsEditing(true)}
                          type="button"
                      >
                        Edit profile
                      </button>
                  )}
                </div>

                <div className="profile-form-grid form-grid">

                  <label>
                    First name

                    <input
                        disabled={!isEditing}
                        name="firstName"
                        onChange={handleChange}
                        value={form.firstName}
                    />
                  </label>

                  <label>
                    Last name

                    <input
                        disabled={!isEditing}
                        name="lastName"
                        onChange={handleChange}
                        value={form.lastName}
                    />
                  </label>

                  <label>
                    Email

                    <input
                        disabled
                        value={profile.email || ""}
                    />
                  </label>

                  <label>
                    Phone

                    <input
                        disabled={!isEditing}
                        name="phone"
                        onChange={handleChange}
                        value={form.phone}
                    />
                  </label>

                  <label>
                    Role

                    <input
                        disabled
                        value={role}
                    />
                  </label>

                  <label>
                    Account status

                    <input
                        disabled
                        value={profile.registrationStatus || "Active"}
                    />
                  </label>

                </div>

                {isEditing && (
                    <div className="form-actions">

                      <button
                          className="button primary"
                          disabled={isSaving}
                          type="submit"
                      >
                        {isSaving ? "Saving..." : "Save changes"}
                      </button>

                      <button
                          className="button secondary"
                          disabled={isSaving}
                          onClick={handleCancel}
                          type="button"
                      >
                        Cancel
                      </button>

                    </div>
                )}
              </form>


              {/* ROLE CAPABILITIES */}
              <div className="panel">

                <h2 className="section-title">
                  Role capabilities
                </h2>

                <p className="subtle">
                  Permissions assigned to your {role} account.
                </p>

                <div className="workflow-list">

                  {capabilities.length ? (
                      capabilities.map((capability, index) => (
                          <div
                              className="workflow-step"
                              key={capability}
                          >
                            <div className="step-number">
                              {index + 1}
                            </div>

                            <div>
                              <strong>{capability}</strong>
                            </div>
                          </div>
                      ))
                  ) : (
                      <p className="subtle">
                        No additional capabilities are configured
                        for this role.
                      </p>
                  )}

                </div>
              </div>


              {/* ACCOUNT ACTIVITY */}
              <div className="panel">

                <h2 className="section-title">
                  Account activity
                </h2>

                <p className="subtle">
                  Recent activity on your account.
                </p>

                {activities.length === 0 ? (

                    <p className="subtle">
                      No account activity recorded yet.
                    </p>

                ) : (

                    <div className="workflow-list">

                      {activities.map((activity) => (
                          <div
                              className="workflow-step"
                              key={activity.activityId}
                          >

                            <div className="step-number">
                              ✓
                            </div>

                            <div>

                              <strong>
                                {activity.activityType}
                              </strong>

                              <p className="subtle">
                                {activity.description}
                              </p>

                              <small className="subtle">
                                {activity.createdAt
                                    ? new Date(
                                        activity.createdAt
                                    ).toLocaleString()
                                    : ""}
                              </small>

                            </div>

                          </div>
                      ))}

                    </div>
                )}

              </div>

            </section>
        ) : null}

      </div>
  );
}

export default Profile;