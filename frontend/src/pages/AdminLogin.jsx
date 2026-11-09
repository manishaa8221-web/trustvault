
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

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      const user = data.user || data.data?.user || data.data || data;
      const token = data.token || data.data?.token;
      const role = user?.role || data.role;

      if (role !== "ADMIN") {
        throw new Error("Access denied. Admin account required.");
      }

      if (!token) {
        throw new Error("Authentication token was not received.");
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
    <div className="admin-login-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 18px;
          background:
            radial-gradient(circle at 15% 15%, #30205c 0%, transparent 35%),
            radial-gradient(circle at 85% 85%, #202c61 0%, transparent 35%),
            #080d1c;
          font-family: Inter, Arial, sans-serif;
          color: white;
        }

        .admin-container {
          width: 100%;
          max-width: 1000px;
          min-height: 580px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 22px;
          background: #11182b;
          box-shadow: 0 25px 80px rgba(0,0,0,0.45);
        }

        .admin-brand {
          padding: 55px 42px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background:
            linear-gradient(145deg, rgba(113,62,214,0.85), rgba(35,44,104,0.95));
        }

        .admin-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 23px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .admin-logo-icon {
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .admin-brand-content {
          margin-top: 45px;
          margin-bottom: 45px;
        }

        .admin-brand-content h1 {
          font-size: 38px;
          line-height: 1.2;
          margin: 0 0 18px;
          letter-spacing: -1.2px;
        }

        .admin-brand-content p {
          color: #dddafa;
          font-size: 15px;
          line-height: 1.8;
          max-width: 350px;
        }

        .security-card {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 17px;
          border-radius: 13px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
        }

        .security-card span {
          font-size: 13px;
          color: #e2e0ff;
          line-height: 1.6;
        }

        .admin-form-section {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 55px 48px;
        }

        .admin-form-section h2 {
          font-size: 29px;
          margin: 0 0 10px;
          color: #ffffff;
        }

        .admin-subtitle {
          color: #9ca9c1;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 35px;
        }

        .admin-form label {
          display: block;
          margin-bottom: 9px;
          color: #dbe3f3;
          font-size: 13px;
          font-weight: 600;
        }

        .admin-input {
          width: 100%;
          padding: 14px 15px;
          margin-bottom: 22px;
          border: 1px solid #34415b;
          border-radius: 9px;
          background: #0b1222;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: white;
          font-size: 14px;
          outline: none;
        }

        .admin-input::placeholder {
          color: #71809b;
          -webkit-text-fill-color: #71809b;
        }

        .admin-input:focus {
          border-color: #9b75ff;
          box-shadow: 0 0 0 3px rgba(155,117,255,0.13);
        }

        .password-wrapper {
          position: relative;
        }

        .password-wrapper .admin-input {
          padding-right: 75px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 12px;
          padding: 5px;
          background: transparent;
          border: none;
          color: #b6a0ff;
          cursor: pointer;
          font-size: 12px;
        }

        .admin-submit {
          width: 100%;
          padding: 15px;
          margin-top: 5px;
          border: none;
          border-radius: 9px;
          background: linear-gradient(100deg, #8155ed, #a44ef4);
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s;
        }

        .admin-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(139,83,240,0.3);
        }

        .admin-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .admin-error {
          padding: 12px;
          margin: 0 0 18px;
          border: 1px solid #a83d58;
          border-radius: 8px;
          background: rgba(168,61,88,0.13);
          color: #ff9eae;
          font-size: 13px;
          line-height: 1.5;
        }

        .admin-footer {
          margin-top: 30px;
          padding-top: 22px;
          border-top: 1px solid #29344b;
          text-align: center;
          color: #8492ab;
          font-size: 12px;
          line-height: 1.7;
        }

        .admin-back-link {
          display: inline-block;
          margin-top: 22px;
          color: #b99bff;
          text-decoration: none;
          font-size: 13px;
        }

        .admin-back-link:hover {
          color: white;
        }

        @media (max-width: 700px) {
          .admin-container {
            grid-template-columns: 1fr;
            max-width: 440px;
          }

          .admin-brand {
            padding: 30px;
          }

          .admin-brand-content {
            margin: 35px 0 10px;
          }

          .admin-brand-content h1 {
            font-size: 28px;
          }

          .security-card {
            display: none;
          }

          .admin-form-section {
            padding: 35px 28px;
          }
        }
      `}</style>

      <div className="admin-container">

        {/* LEFT BRANDING SECTION */}
        <div className="admin-brand">
          <div className="admin-logo">
            <div className="admin-logo-icon">
              <svg
                width="27"
                height="27"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.8"
              >
                <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            TrustVault
          </div>

          <div className="admin-brand-content">
            <h1>
              Secure Access.
              <br />
              Complete Control.
            </h1>

            <p>
              Manage your TrustVault platform through a
              dedicated and secure administrator portal.
            </p>
          </div>

          <div className="security-card">
            <span style={{ fontSize: "25px" }}>🛡️</span>
            <span>
              <strong>Protected Admin Portal</strong>
              <br />
              Restricted access for authorized administrators only.
            </span>
          </div>
        </div>

        {/* RIGHT LOGIN SECTION */}
        <div className="admin-form-section">
          <h2>Welcome Back</h2>

          <p className="admin-subtitle">
            Sign in with your administrator credentials to continue.
          </p>

          <form className="admin-form" onSubmit={handleLogin}>
            <label htmlFor="admin-email">Administrator Email</label>

            <input
              id="admin-email"
              className="admin-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your admin email"
              autoComplete="username"
              required
            />

            <label htmlFor="admin-password">Password</label>

            <div className="password-wrapper">
              <input
                id="admin-password"
                className="admin-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && (
              <div className="admin-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="admin-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Secure Admin Login →"}
            </button>
          </form>

          <div className="admin-footer">
            <div>🔒 Secure Administrator Authentication</div>
            <div>Unauthorized access is prohibited.</div>
          </div>

          <Link to="/user-login" className="admin-back-link">
            ← Back to User Login
          </Link>
        </div>

      </div>
    </div>
  );
}

export default AdminLogin;
