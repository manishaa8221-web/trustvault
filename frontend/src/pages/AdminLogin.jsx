
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      const user = data.user || data.data?.user || data.data || data;
      const token = data.token || data.data?.token;
      const role = user?.role || data.role;

      if (role !== "ADMIN") {
        setError("Access denied. Only administrators can log in here.");
        setLoading(false);
        return;
      }

      if (!token) {
        setError("Login successful, but authentication token was not received.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);

      navigate("/admin");
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-icon">🔐</div>

        <h1>Admin Login</h1>
        <p className="admin-subtitle">
          Sign in to access the TrustVault administration dashboard.
        </p>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <label htmlFor="admin-email">Email Address</label>
          <input
            id="admin-email"
            className="admin-input"
            type="email"
            placeholder="Enter your admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="admin-password">Password</label>

          <div className="admin-password-wrapper">
            <input
              id="admin-password"
              className="admin-input admin-password-input"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="admin-show-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>

        <Link to="/user-login" className="admin-back-link">
          Back to User Login
        </Link>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-login-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 25px;
          background: linear-gradient(135deg, #080d1c, #14233e, #172b4d);
          font-family: Arial, sans-serif;
        }

        .admin-login-card {
          width: 100%;
          max-width: 430px;
          padding: 38px;
          border: 1px solid #34415b;
          border-radius: 18px;
          background: #111a2c;
          color: #ffffff;
          box-shadow: 0 15px 45px rgba(0, 0, 0, 0.35);
        }

        .admin-icon {
          text-align: center;
          font-size: 42px;
          margin-bottom: 12px;
        }

        .admin-login-card h1 {
          text-align: center;
          font-size: 27px;
          margin: 0 0 10px;
          color: #ffffff;
        }

        .admin-subtitle {
          text-align: center;
          color: #aebbd0;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 30px;
        }

        .admin-login-card label {
          display: block;
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 9px;
        }

        .admin-input {
          width: 100%;
          padding: 14px 15px;
          margin-bottom: 22px;
          border: 1px solid #34415b;
          border-radius: 9px;
          background: #0b1222 !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          font-size: 14px;
          outline: none;
          opacity: 1 !important;
        }

        .admin-input:focus {
          border-color: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
        }

        .admin-input::placeholder {
          color: #9ca9c1 !important;
          -webkit-text-fill-color: #9ca9c1 !important;
          opacity: 1;
        }

        .admin-input:-webkit-autofill,
        .admin-input:-webkit-autofill:hover,
        .admin-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          box-shadow: 0 0 0 1000px #0b1222 inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .admin-password-wrapper {
          position: relative;
        }

        .admin-password-input {
          padding-right: 65px;
        }

        .admin-show-password {
          position: absolute;
          right: 12px;
          top: 13px;
          border: none;
          background: transparent;
          color: #38bdf8;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .admin-login-button {
          width: 100%;
          padding: 14px;
          margin-top: 5px;
          border: none;
          border-radius: 9px;
          background: linear-gradient(135deg, #0284c7, #2563eb);
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .admin-login-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .admin-login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .admin-error {
          padding: 12px;
          margin-bottom: 20px;
          border: 1px solid #ef4444;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.12);
          color: #fca5a5;
          font-size: 13px;
          line-height: 1.5;
        }

        .admin-back-link {
          display: block;
          margin-top: 24px;
          text-align: center;
          color: #7dd3fc;
          font-size: 14px;
          text-decoration: none;
        }

        .admin-back-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .admin-login-card {
            padding: 27px 22px;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminLogin;
