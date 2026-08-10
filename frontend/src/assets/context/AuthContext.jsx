import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext, roleCapabilities } from "./auth";

const STORAGE_KEY = "shiptrack_auth";
const OTP_STORAGE_KEY = "shiptrack_otps";

// Keys we persist in localStorage for identity (not security)
const IDENTITY_KEYS = ["token", "role", "userId", "firstName", "lastName", "email"];

const withoutPassword = (user) => {
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
};

const createToken = (user) =>
  `demo-jwt.${btoa(JSON.stringify({ sub: user.id, role: user.role, iat: Date.now() }))}.shiptrack`;

/**
 * Read persisted auth state from localStorage.
 * We store token + role + identity fields after login so that
 * a page refresh doesn't lose the user's name.
 */
const getStoredAuth = () => {
  try {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");

    if (!token) return null;

    return {
      token,
      user: {
        role,
        userId:    localStorage.getItem("userId")    ? Number(localStorage.getItem("userId")) : undefined,
        firstName: localStorage.getItem("firstName") || undefined,
        lastName:  localStorage.getItem("lastName")  || undefined,
        email:     localStorage.getItem("email")     || undefined,
      },
    };
  } catch {
    return null;
  }
};

const getStoredOtpRequests = () => {
  try {
    const value = localStorage.getItem(OTP_STORAGE_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

const createOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const getGoogleSeedUser = (options = {}) => {
  const normalizedEmail = String(options.email || "").trim().toLowerCase();
  const isAdminFlow = options.role === "Administrator" || normalizedEmail.includes("admin");

  return {
    id: isAdminFlow ? "USR-GOOGLE-ADMIN" : "USR-GOOGLE",
    name: isAdminFlow ? (options.name || "Google Admin") : (options.name || "Google User"),
    email: normalizedEmail || (isAdminFlow ? "admin.google@shiptrack.com" : "google.user@shiptrack.com"),
    password: isAdminFlow ? "google-oauth-admin" : "google-oauth",
    role: isAdminFlow ? "Administrator" : (options.role || "Customer"),
    company: options.company || "Google Workspace",
  };
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getStoredAuth);

  // Re-hydrate on mount (handles refresh)
  useEffect(() => {
    const stored = getStoredAuth();
    if (stored) setAuth(stored);
  }, []);

  // Demo registered users (for OTP / forgot-password flow only — not used for real login)
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const saved = localStorage.getItem("shiptrack_users");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [otpRequests, setOtpRequests] = useState(getStoredOtpRequests);

  useEffect(() => {
    localStorage.setItem("shiptrack_users", JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // Persist auth state to localStorage whenever it changes
  useEffect(() => {
    if (auth?.token) {
      localStorage.setItem("token", auth.token);

      if (auth.user?.role)      localStorage.setItem("role",      auth.user.role);
      if (auth.user?.userId)    localStorage.setItem("userId",    String(auth.user.userId));
      if (auth.user?.firstName) localStorage.setItem("firstName", auth.user.firstName);
      if (auth.user?.lastName)  localStorage.setItem("lastName",  auth.user.lastName);
      if (auth.user?.email)     localStorage.setItem("email",     auth.user.email);
    } else {
      IDENTITY_KEYS.forEach((k) => localStorage.removeItem(k));
    }
  }, [auth]);

  useEffect(() => {
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpRequests));
  }, [otpRequests]);

  // -------------------------------------------------------------------------
  // updateAuth — called by Login.jsx after successful backend login.
  // Accepts the full backend AuthResponse payload.
  // -------------------------------------------------------------------------
  const updateAuth = useCallback((token, role, userData = {}) => {
    setAuth({
      token,
      user: {
        role,
        userId:    userData.userId    ?? undefined,
        firstName: userData.firstName ?? undefined,
        lastName:  userData.lastName  ?? undefined,
        email:     userData.email     ?? undefined,
        // Convenience display name
        name: userData.firstName
          ? `${userData.firstName} ${userData.lastName || ""}`.trim()
          : undefined,
      },
    });
  }, []);

  const googleLogin = useCallback(
    (externalUser = null, options = {}) => {
      const user = externalUser || getGoogleSeedUser(options);

      const normalizedEmail = user.email.toLowerCase();
      const existingUser = registeredUsers.find(
        (candidate) => candidate.email.toLowerCase() === normalizedEmail,
      );

      const resolvedUser = existingUser || {
        ...user,
        id: `USR-${String(registeredUsers.length + 1).padStart(3, "0")}`,
      };

      const safeUser = withoutPassword(resolvedUser);
      setAuth({ token: createToken(resolvedUser), user: safeUser });

      if (!existingUser) {
        setRegisteredUsers((users) => [...users, resolvedUser]);
      }

      return { ok: true, user: safeUser };
    },
    [registeredUsers],
  );

  const requestOtp = useCallback(
    ({ email, purpose }) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        return { ok: false, message: "Please enter an email address." };
      }

      if (purpose === "password-reset") {
        const exists = registeredUsers.some(
          (candidate) => candidate.email.toLowerCase() === normalizedEmail,
        );

        if (!exists) {
          return { ok: false, message: "No account is registered with that email address." };
        }
      }

      const code = createOtpCode();
      console.log(`[OTP] Generated code for ${normalizedEmail}:`, code);
      setOtpRequests((current) => ({
        ...current,
        [normalizedEmail]: {
          purpose,
          code,
          expiresAt: Date.now() + 10 * 60 * 1000,
        },
      }));

      return {
        ok: true,
        message: `A verification code was sent to ${normalizedEmail}. It will expire in 10 minutes.`,
      };
    },
    [registeredUsers]
  );

  const verifyOtp = useCallback(
    ({ email, otp, purpose }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const record = otpRequests[normalizedEmail];

      if (!record) {
        return { ok: false, message: "No verification code was requested for this email." };
      }

      if (record.purpose !== purpose) {
        return { ok: false, message: "The verification code does not match this flow." };
      }

      if (Date.now() > record.expiresAt) {
        return { ok: false, message: "The verification code has expired. Please request a new one." };
      }

      if (String(otp).trim() !== record.code) {
        return { ok: false, message: "The verification code is invalid." };
      }

      return { ok: true, message: "Verification succeeded." };
    },
    [otpRequests],
  );

  const resetPassword = useCallback(
    ({ email, otp, password }) => {
      const verified = verifyOtp({ email, otp, purpose: "password-reset" });
      if (!verified.ok) {
        return verified;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const targetUser = registeredUsers.find(
        (candidate) => candidate.email.toLowerCase() === normalizedEmail,
      );

      if (!targetUser) {
        return { ok: false, message: "No account is registered with that email address." };
      }

      const updatedUser = { ...targetUser, password };
      setRegisteredUsers((users) =>
        users.map((user) => (user.id === targetUser.id ? updatedUser : user)),
      );
      const safeUser = withoutPassword(updatedUser);
      setAuth({ token: createToken(updatedUser), user: safeUser });

      return {
        ok: true,
        user: safeUser,
        message: "Your password has been updated successfully.",
      };
    },
    [registeredUsers, verifyOtp],
  );

  const logout = useCallback(() => setAuth(null), []);

  const updateAuthenticatedUser = useCallback((profile) => {
    setAuth((current) => {
      if (!current) return current;

      const firstName = profile.firstName ?? current.user?.firstName ?? "";
      const lastName  = profile.lastName  ?? current.user?.lastName  ?? "";

      return {
        ...current,
        user: {
          ...current.user,
          ...profile,
          name: `${firstName} ${lastName}`.trim() || current.user?.name,
        },
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.token),
      logout,
      updateAuth,
      updateAuthenticatedUser,
      requestOtp,
      verifyOtp,
      resetPassword,
      googleLogin,
      users: registeredUsers.map(withoutPassword),
      capabilities: auth?.user ? roleCapabilities[auth.user.role] || [] : [],
    }),
    [auth, logout, updateAuth, updateAuthenticatedUser, registeredUsers, requestOtp, verifyOtp, resetPassword, googleLogin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
