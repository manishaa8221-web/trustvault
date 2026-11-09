
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

export default function Login() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("OWNER");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // LOGIN
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
        throw new Error(data.message || "Login failed");
      }

      const role = data.role || data.user?.role || data.data?.role;
      const token = data.token || data.data?.token;

      if (!["OWNER", "VIEWER"].includes(role)) {
        throw new Error(
          "This login page is only for user accounts."
        );
      }

      if (!token) {
        throw new Error(
          "Login token was not returned by the server."
        );
      }

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      alert(
        `Account created successfully as ${
          selectedRole === "OWNER" ? "Owner" : "User (Viewer)"
        }! Please log in.`
      );

      setName("");
      setEmail("");
      setPassword("");
      setSelectedRole("OWNER");
      setShowPassword(false);
      setActiveTab("login");
      setError("");
    } catch (err) {
      setError(err.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError("");
    setPassword("");
    setShowPassword(false);
  };

  return (
    <div className="trustvault-user-auth" style={s.page}>
      <style>{`
        .trustvault-user-auth,
        .trustvault-user-auth * {
          box-sizing: border-box;
        }

        .trustvault-user-auth input {
          color: #172d3b !important;
          -webkit-text-fill-color: #172d3b !important;
          caret-color: #126b70 !important;
          opacity: 1 !important;
        }

        .trustvault-user-auth input::placeholder {
          color: #718096 !important;
          -webkit-text-fill-color: #718096 !important;
          opacity: 1 !important;
        }

        .trustvault-user-auth input:-webkit-autofill,
        .trustvault-user-auth input:-webkit-autofill:hover,
        .trustvault-user-auth input:-webkit-autofill:focus {
          -webkit-text-fill-color: #172d3b !important;
          caret-color: #126b70 !important;
          box-shadow: 0 0 0 1000px #fbfdfd inset !important;
          transition: background-color 9999s ease-in-out 0s;
        }

        .trustvault-user-auth input:focus {
          border-color: #126b70 !important;
          outline: none;
          box-shadow: 0 0 0 3px rgba(18, 107, 112, 0.12);
        }

        .trustvault-user-auth .password-wrapper {
          position: relative;
        }

        .trustvault-user-auth .password-input {
          padding-right: 75px !important;
        }

        .trustvault-user-auth .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: #126b70;
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
          padding: 6px;
        }

        .trustvault-user-auth .submit-button:hover:not(:disabled) {
          background: #0e555a !important;
        }

        .trustvault-user-auth .role-option {
          flex: 1;
          padding: 13px 10px;
          border: 1px solid #d5e1e5;
          border-radius: 9px;
          background: #ffffff;
          color: #263d4a;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .trustvault-user-auth .role-option.selected {
          border: 2px solid #126b70;
          background: #eaf5f4;
        }

        .trustvault-user-auth .role-option:focus-visible {
          outline: 3px solid rgba(18, 107, 112, 0.2);
        }

        .trustvault-user-auth .admin-login-link:hover {
          color: #0e555a !important;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .trustvault-user-auth .auth-card {
            padding: 25px 20px !important;
          }
        }
      `}</style>

      <div style={s.container}>
        <div style={s.welcome}>
          <div style={s.brandIcon}>🔐</div>
          <h1>Welcome to TrustVault</h1>
          <p>
            Your secure space to upload, manage and
            share important documents.
          </p>
        </div>

        <div className="auth-card" style={s.card}>
          <div style={s.icon}>👤</div>

          <h2 style={s.heading}>User Account</h2>

          <p style={s.subtitle}>
            Securely manage your documents.
          </p>

          <div style={s.tabs}>
            <button
              type="button"
              onClick={() => switchTab("login")}
              style={{
                ...s.tab,
                ...(activeTab === "login" ? s.activeTab : {}),
              }}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => switchTab("register")}
              style={{
                ...s.tab,
                ...(activeTab === "register" ? s.activeTab : {}),
              }}
            >
              Create Account
            </button>
          </div>

          <form
            onSubmit={
              activeTab === "login"
                ? handleLogin
                : handleRegister
            }
          >
            {activeTab === "register" && (
              <>
                <label style={s.label}>Full Name</label>

                <input
                  style={s.input}
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />

                <label style={s.label}>Choose Account Type</label>

                <div style={s.roleContainer}>
                  <button
                    type="button"
                    className={`role-option ${
                      selectedRole === "OWNER" ? "selected" : ""
                    }`}
                    aria-pressed={selectedRole === "OWNER"}
                    onClick={() => setSelectedRole("OWNER")}
                  >
                    <span style={s.roleIcon}>📁</span>
                    <strong style={s.roleTitle}>Owner</strong>
                    <span style={s.roleDescription}>
                      Upload, manage and share your documents.
                    </span>
                    {selectedRole === "OWNER" && (
                      <span style={s.selectedText}>✓ Selected</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`role-option ${
                      selectedRole === "VIEWER" ? "selected" : ""
                    }`}
                    aria-pressed={selectedRole === "VIEWER"}
                    onClick={() => setSelectedRole("VIEWER")}
                  >
                    <span style={s.roleIcon}>👤</span>
                    <strong style={s.roleTitle}>User (Viewer)</strong>
                    <span style={s.roleDescription}>
                      Access documents shared with you.
                    </span>
                    {selectedRole === "VIEWER" && (
                      <span style={s.selectedText}>✓ Selected</span>
                    )}
                  </button>
                </div>
              </>
            )}

            <label style={s.label}>Email Address</label>

            <input
              style={s.input}
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <label style={s.label}>Password</label>

            <div className="password-wrapper">
              <input
                className="password-input"
                style={s.input}
                type={showPassword ? "text" : "password"}
                placeholder={
                  activeTab === "login"
                    ? "Enter your password"
                    : "Create a password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={activeTab === "register" ? 6 : undefined}
                autoComplete={
                  activeTab === "login"
                    ? "current-password"
                    : "new-password"
                }
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
              <p style={s.error} role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="submit-button"
              style={{
                ...s.button,
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading
                ? activeTab === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : activeTab === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <p style={s.bottom}>
            {activeTab === "login" ? (
              <>
                New to TrustVault?{" "}
                <button
                  type="button"
                  style={s.textButton}
                  onClick={() => switchTab("register")}
                >
                  Create an Account
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  type="button"
                  style={s.textButton}
                  onClick={() => switchTab("login")}
                >
                  Login
                </button>
              </>
            )}
          </p>

          {/* ADMIN LOGIN LINK */}
          <div style={s.adminSection}>
            <p style={s.adminText}>
              Are you an administrator?
            </p>

            <button
              type="button"
              className="admin-login-link"
              style={s.adminLink}
              onClick={() => navigate("/admin-login")}
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>

      <footer style={s.footer}>
        © 2026 TrustVault. Secure access for everyone.
      </footer>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    background: `
      radial-gradient(ellipse at 12% 18%, rgba(48, 190, 170, 0.28), transparent 35%),
      radial-gradient(ellipse at 88% 82%, rgba(48, 130, 170, 0.28), transparent 38%),
      radial-gradient(ellipse at 75% 10%, rgba(92, 120, 170, 0.18), transparent 32%),
      linear-gradient(135deg, #091b2a 0%, #103746 48%, #164c57 100%)
    `,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: 650,
  },

  welcome: {
    textAlign: "center",
    marginBottom: 30,
    color: "#ffffff",
  },

  brandIcon: {
    fontSize: 38,
    marginBottom: 10,
  },

  card: {
    width: "100%",
    maxWidth: 430,
    boxSizing: "border-box",
    background: "rgba(255, 255, 255, 0.97)",
    padding: "35px 38px",
    borderRadius: 18,
    margin: "auto",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.28)",
  },

  icon: {
    margin: "5px auto 18px",
    width: 60,
    height: 60,
    display: "grid",
    placeItems: "center",
    borderRadius: 18,
    background: "#e1f3f1",
    fontSize: 30,
  },

  heading: {
    textAlign: "center",
    color: "#172d3b",
    fontSize: 24,
    marginBottom: 10,
  },

  subtitle: {
    textAlign: "center",
    color: "#718096",
    fontSize: 14,
    marginBottom: 25,
  },

  tabs: {
    display: "flex",
    gap: 8,
    padding: 5,
    background: "#edf3f4",
    borderRadius: 9,
    marginBottom: 22,
  },

  tab: {
    flex: 1,
    padding: 12,
    border: 0,
    borderRadius: 7,
    background: "transparent",
    color: "#526575",
    fontSize: 14,
    fontWeight: "bold",
    cursor: "pointer",
  },

  activeTab: {
    background: "#126b70",
    color: "#ffffff",
    boxShadow: "0 2px 7px #126b7030",
  },

  label: {
    display: "block",
    textAlign: "left",
    fontWeight: "600",
    fontSize: 14,
    color: "#263d4a",
    margin: "18px 0 8px",
  },

  roleContainer: {
    display: "flex",
    gap: 10,
    width: "100%",
  },

  roleIcon: {
    display: "block",
    fontSize: 23,
    marginBottom: 8,
  },

  roleTitle: {
    display: "block",
    fontSize: 14,
    marginBottom: 7,
  },

  roleDescription: {
    display: "block",
    fontSize: 12,
    lineHeight: 1.5,
    color: "#64748b",
  },

  selectedText: {
    display: "block",
    marginTop: 9,
    fontSize: 12,
    fontWeight: "bold",
    color: "#126b70",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    display: "block",
    padding: 13,
    border: "1px solid #d5e1e5",
    borderRadius: 8,
    fontSize: 15,
    background: "#fbfdfd",
  },

  button: {
    width: "100%",
    marginTop: 28,
    padding: 14,
    background: "#126b70",
    color: "#ffffff",
    border: 0,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer",
  },

  error: {
    color: "#dc2626",
    fontSize: 14,
    marginTop: 12,
  },

  bottom: {
    textAlign: "center",
    marginTop: 25,
    fontSize: 14,
    color: "#718096",
  },

  textButton: {
    border: 0,
    padding: 0,
    background: "transparent",
    color: "#126b70",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: 14,
  },

  adminSection: {
    textAlign: "center",
    marginTop: 22,
    paddingTop: 18,
    borderTop: "1px solid #edf0f2",
  },

  adminText: {
    margin: "0 0 10px",
    color: "#718096",
    fontSize: 14,
  },

  adminLink: {
    border: 0,
    padding: 4,
    background: "transparent",
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer",
  },

  footer: {
    textAlign: "center",
    padding: 20,
    color: "#c5d9df",
    fontSize: 13,
  },
};
