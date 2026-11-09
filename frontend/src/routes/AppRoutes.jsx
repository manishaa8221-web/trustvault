
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import AdminLogin from "../pages/AdminLogin";

import Dashboard from "../pages/Dashboard";
import Documents from "../pages/Documents";
import Admin from "../pages/Admin";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Open User Login directly */}
        <Route path="/" element={<Navigate to="/user-login" replace />} />

        {/* User pages */}
        <Route path="/user-login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Separate Admin login */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* User dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "VIEWER"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Documents page */}
        <Route
          path="/documents"
          element={
            <ProtectedRoute allowedRoles={["OWNER", "VIEWER", "ADMIN"]}>
              <Documents />
            </ProtectedRoute>
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Invalid URLs go to User Login */}
        <Route path="*" element={<Navigate to="/user-login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
