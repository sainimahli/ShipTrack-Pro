import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext, roleCapabilities } from "./auth";

const STORAGE_KEY = "shiptrack_auth";

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

  const login = useCallback(
    ({ email, password }) => {
      const user = registeredUsers.find(
        (candidate) =>
          candidate.email.toLowerCase() === email.trim().toLowerCase() &&
          candidate.password === password,
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

  const register = useCallback(
    ({ name, email, password, role, company }) => {
      const exists = registeredUsers.some(
        (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
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
      users: registeredUsers.map(withoutPassword),
      capabilities: auth?.user ? roleCapabilities[auth.user.role] || [] : [],
    }),
    [auth, login, logout, register, registeredUsers],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
