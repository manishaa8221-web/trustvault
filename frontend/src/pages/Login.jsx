
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

export default function Login() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        throw new Error(data.message || "Login failed");
      }

      const role =
        data.role || data.user?.role || data.data?.role;

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      alert("Account created successfully! Please log in.");

      setName("");
      setPassword("");
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
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.welcome}>
          <div style={s.brandIcon}>🔐</div>
          <h1>Welcome to TrustVault</h1>
          <p>
            Your secure space to upload, manage and
            share important documents.
          </p>
        </div>

        <div style={s.card}>
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

            <input
              style={s.input}
              type="password"
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

            {error && <p style={s.error}>{error}</p>}

            <button
              type="submit"
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
        </div>

        <div style={s.adminLink}>
          <Link to="/admin-login" style={s.adminLinkText}>
            Admin Login
          </Link>
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

  adminLink: {
    textAlign: "center",
    marginTop: 20,
  },

  adminLinkText: {
    color: "#d4eeee",
    fontSize: 14,
    textDecoration: "none",
    fontWeight: "bold",
  },

  footer: {
    textAlign: "center",
    padding: 20,
    color: "#c5d9df",
    fontSize: 13,
  },
};
