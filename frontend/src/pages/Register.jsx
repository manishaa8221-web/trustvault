
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            password,
            role: "OWNER",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      alert("User account created successfully. Please log in.");
      navigate("/user-login");
    } catch (err) {
      setError(err.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/" style={s.back}>
          ← Back to Home
        </Link>
                <div style={s.icon}>👤</div>

        <h1 style={s.heading}>Create User Account</h1>

        <p style={s.subtitle}>
          Register to securely manage your documents.
        </p>

        <form onSubmit={handleRegister}>
          <label style={s.label}>Username</label>

          <input
            style={s.input}
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            autoComplete="username"
            required
          />

          <label style={s.label}>Password</label>

          <input
            style={s.input}
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={s.bottom}>
          Already registered?{" "}
          <Link to="/user-login" style={s.loginLink}>
            User Login
          </Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#f1f5fb",
    display: "grid",
    placeItems: "center",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: 430,
    boxSizing: "border-box",
    background: "#ffffff",
    padding: "35px 38px",
    borderRadius: 16,
    boxShadow: "0 10px 35px #17233c16",
  },

  back: {
    color: "#2449a6",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
  },

  icon: {
    margin: "25px auto 15px",
    width: 55,
    height: 55,
    display: "grid",
    placeItems: "center",
    borderRadius: 15,
    background: "#e8efff",
    color: "#2449a6",
    fontSize: 24,
    fontWeight: "bold",
  },

  heading: {
    textAlign: "center",
    color: "#17233c",
    fontSize: 25,
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
    width: "100%",
    textAlign: "left",
    fontWeight: "600",
    fontSize: 14,
    color: "#26344d",
    margin: "18px 0 8px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    display: "block",
    padding: 13,
    border: "1px solid #d5dce8",
    borderRadius: 8,
    fontSize: 15,
    outline: "none",
    background: "#ffffff",
  },

  button: {
    width: "100%",
    marginTop: 28,
    padding: 14,
    background: "#2449a6",
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
    textAlign: "left",
  },

  bottom: {
    textAlign: "center",
    marginTop: 25,
    fontSize: 14,
    color: "#718096",
  },

  loginLink: {
    color: "#2449a6",
    fontWeight: "bold",
    textDecoration: "none",
  },
};
