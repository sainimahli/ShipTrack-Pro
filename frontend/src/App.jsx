import { useContext } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Navbar from "./assets/components/layout/Navbar";
import Sidebar from "./assets/components/layout/Sidebar";
import { AuthContext } from "./assets/context/auth";
import { AuthProvider } from "./assets/context/AuthContext";
import { ShipmentProvider } from "./assets/context/ShipmentContext";
import CreateShipment from "./assets/pages/CreateShipment";
import Dashboard from "./assets/pages/Dashboard";
import ForgotPassword from "./assets/pages/ForgotPassword";
import Login from "./assets/pages/Login";
import ManageUsers from "./assets/pages/ManageUsers";
import OAuth2Success from "./assets/pages/OAuth2Success";
import Profile from "./assets/pages/Profile";
import Register from "./assets/pages/Register";
import ShipmentList from "./assets/pages/ShipmentList";
import TrackShipment from "./assets/pages/TrackShipment";
import RouteManagement from "./assets/pages/RouteManagement";


const roleLabels = {
  ADMINISTRATOR: "Administrator",
};

const normalizeRole = (role) => roleLabels[role] || role || "Customer";

const canManageUsers = (role) => normalizeRole(role) === "Administrator";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { auth } = useContext(AuthContext);
  return canManageUsers(auth?.user?.role) ? children : <Navigate to="/dashboard" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function AppLayout() {
  return (
    <ProtectedRoute>
      <div className="app-shell">
        <Sidebar />
        <main className="content">
          <Navbar />
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/shipments" element={<ShipmentList />} />
            <Route path="/shipments/new" element={<CreateShipment />} />
            <Route path="/track" element={<TrackShipment />} />
            <Route path="/tracking" element={<TrackShipment />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/users/manage" element={<AdminRoute><ManageUsers /></AdminRoute>} />
            <Route path="/routes" element={<RouteManagement />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <ShipmentProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route path="/dashboard/success" element={<OAuth2Success />} />
            <Route path="/*" element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      </ShipmentProvider>
    </AuthProvider>
  );
}

export default App;
