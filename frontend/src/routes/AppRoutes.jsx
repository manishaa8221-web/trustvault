
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import AdminLogin from "../pages/AdminLogin";

import Dashboard from "../pages/Dashboard";
import Documents from "../pages/Documents";
import Admin from "../pages/Admin";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Combined User Login and Registration */}
        <Route path="/" element={<Login />} />
        <Route path="/user-login" element={<Login />} />

        {/* Redirect old registration links to combined page */}
        <Route
          path="/register"
          element={<Navigate to="/user-login" replace />}
        />

        {/* Separate Admin Login */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* User Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "VIEWER"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Documents */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "VIEWER", "ADMIN"]}>
              <Documents />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Invalid URLs */}
        <Route path="*" element={<Navigate to="/user-login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
