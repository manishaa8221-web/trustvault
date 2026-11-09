
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const role = data.role || data.user?.role || data.data?.role;
      const token = data.token || data.data?.token;

      if (!["OWNER", "VIEWER"].includes(role)) {
        throw new Error("This login page is only for user accounts.");
      }

      if (!token) {
        throw new Error("Login token was not returned by the server.");
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

          <h2 style={s.heading}>User Login</h2>

          <p style={s.subtitle}>
            Sign in to access your documents securely.
          </p>

          <form onSubmit={handleLogin}>
            <label style={s.label}>Username</label>

            <input
              style={s.input}
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />

            <label style={s.label}>Password</label>

            <input
              style={s.input}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {error && <p style={s.error}>{error}</p>}

            <button
              type="submit"
              style={s.button}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={s.bottom}>
            New to TrustVault?{" "}
            <Link to="/register" style={s.registerLink}>
              Create a User Account
            </Link>
          </p>
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
    position: "relative",
    overflow: "hidden",
  },

  container: {
    width: "100%",
    maxWidth: 650,
    position: "relative",
    zIndex: 1,
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
    marginBottom: 28,
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

  registerLink: {
    color: "#126b70",
    fontWeight: "bold",
    textDecoration: "none",
  },

  footer: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    padding: 20,
    color: "#c5d9df",
    fontSize: 13,
  },
};
