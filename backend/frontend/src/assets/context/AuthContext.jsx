import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext, roleCapabilities } from "./auth";

const STORAGE_KEY = "shiptrack_auth";
const OTP_STORAGE_KEY = "shiptrack_otps";

const demoUsers = [
  {
    id: "USR-001",
    name: "Priya Sharma",
    email: "admin@shiptrack.com",
    password: "admin123",
    role: "Administrator",
    company: "ShipTrack Control Tower",
  },
  {
    id: "USR-002",
    name: "Rahul Mehta",
    email: "operator@shiptrack.com",
    password: "operator123",
    role: "Logistics Operator",
    company: "West Zone Fulfillment",
  },
  {
    id: "USR-003",
    name: "Ananya Rao",
    email: "customer@shiptrack.com",
    password: "customer123",
    role: "Customer",
    company: "Personal Account",
  },
];

const withoutPassword = (user) => {
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
};

const createToken = (user) =>
  `demo-jwt.${btoa(JSON.stringify({ sub: user.id, role: user.role, iat: Date.now() }))}.shiptrack`;

const getStoredAuth = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : null;
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

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getStoredAuth);
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const saved = localStorage.getItem("shiptrack_users");
      return saved ? JSON.parse(saved) : demoUsers;
    } catch {
      return demoUsers;
    }
  });
  const [otpRequests, setOtpRequests] = useState(getStoredOtpRequests);

  useEffect(() => {
    localStorage.setItem("shiptrack_users", JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  useEffect(() => {
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpRequests));
  }, [otpRequests]);

  const login = useCallback(
    ({ email, password }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const user = registeredUsers.find(
        (candidate) =>
          candidate.email.toLowerCase() === normalizedEmail && candidate.password === password,
      );

      if (!user) {
        return { ok: false, message: "Email or password is incorrect." };
      }

      const safeUser = withoutPassword(user);
      setAuth({ token: createToken(user), user: safeUser });
      return { ok: true, user: safeUser };
    },
    [registeredUsers],
  );

  const googleLogin = useCallback(
    (externalUser = null, options = {}) => {
      const user = externalUser || {
        id: "USR-GOOGLE",
        name: options.name || "Google User",
        email: options.email || "google.user@shiptrack.com",
        password: "google-oauth",
        role: options.role || "Customer",
        company: options.company || "Google Workspace",
      };

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

  const register = useCallback(
    ({ name, email, password, role, company }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const exists = registeredUsers.some(
        (candidate) => candidate.email.toLowerCase() === normalizedEmail,
      );

      if (exists) {
        return { ok: false, message: "An account with this email already exists." };
      }

      const newUser = {
        id: `USR-${String(registeredUsers.length + 1).padStart(3, "0")}`,
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        company: company.trim() || "ShipTrack Pro",
      };

      setRegisteredUsers((users) => [...users, newUser]);
      const safeUser = withoutPassword(newUser);
      setAuth({ token: createToken(newUser), user: safeUser });
      return { ok: true, user: safeUser };
    },
    [registeredUsers],
  );

  const logout = useCallback(() => setAuth(null), []);

  const value = useMemo(
    () => ({
      auth,
      isAuthenticated: Boolean(auth?.token),
      login,
      logout,
      register,
      requestOtp,
      verifyOtp,
      resetPassword,
      googleLogin,
      users: registeredUsers.map(withoutPassword),
      capabilities: auth?.user ? roleCapabilities[auth.user.role] || [] : [],
    }),
    [auth, login, logout, register, registeredUsers, requestOtp, verifyOtp, resetPassword, googleLogin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
