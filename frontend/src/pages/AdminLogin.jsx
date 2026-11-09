import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      const user = data.user || data.data?.user || data.data || data;
      const token = data.token || data.data?.token;
      const role = user.role || data.role;

      if (role !== "ADMIN") {
        throw new Error("Access denied. Admin account required.");
      }

      if (!token) {
        throw new Error("Login succeeded but authentication token was not received.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);

      navigate("/admin");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f1f5f9",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        width: "380px",
        padding: "35px",
        background: "white",
        borderRadius: "14px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.08)"
      }}>
        <Link to="/" style={{ textDecoration: "none", color: "#2563eb" }}>
          ← Back to Home
        </Link>

        <h1 style={{ marginTop: "25px" }}>Administrator Login</h1>
        <p style={{ color: "#64748b" }}>
          Authorized administrators only.
        </p>

        <form onSubmit={handleLogin}>
          <label>Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter admin email"
            required
            style={inputStyle}
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            style={inputStyle}
          />

          {error && (
            <p style={{ color: "red", marginTop: "12px" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? "Signing In..." : "Admin Sign In"}
          </button>
        </form>

        <p style={{
          marginTop: "20px",
          textAlign: "center",
          color: "#64748b",
          fontSize: "13px"
        }}>
          This portal is restricted to authorized administrators.
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  marginBottom: "18px",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: "7px"
};

const buttonStyle = {
  width: "100%",
  padding: "13px",
  background: "#1d4ed8",
  color: "white",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer",
  fontWeight: "bold"
};

export default AdminLogin;