
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      alert("User account created successfully. Please log in.");
      navigate("/user-login");
    } catch (err) {
      setError(err.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trustvault-register-page" style={s.page}>
      <style>{`
        .trustvault-register-page,
        .trustvault-register-page * {
          box-sizing: border-box;
        }

        .trustvault-register-page input {
          color: #17233c !important;
          -webkit-text-fill-color: #17233c !important;
          caret-color: #2449a6 !important;
          opacity: 1 !important;
        }

        .trustvault-register-page input::placeholder {
          color: #718096 !important;
          -webkit-text-fill-color: #718096 !important;
          opacity: 1 !important;
        }

        .trustvault-register-page input:-webkit-autofill,
        .trustvault-register-page input:-webkit-autofill:hover,
        .trustvault-register-page input:-webkit-autofill:focus {
          -webkit-text-fill-color: #17233c !important;
          caret-color: #2449a6 !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
          transition: background-color 9999s ease-in-out 0s;
        }

        .trustvault-register-page input:focus {
          border-color: #2449a6 !important;
          box-shadow: 0 0 0 3px rgba(36, 73, 166, 0.10);
          outline: none;
        }

        .trustvault-register-page .register-password-wrapper {
          position: relative;
        }

        .trustvault-register-page .register-password-input {
          padding-right: 75px !important;
        }

        .trustvault-register-page .register-password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: #2449a6;
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
          padding: 6px;
        }

        .trustvault-register-page .register-submit:hover:not(:disabled) {
          background: #193c91;
        }

        @media (max-width: 480px) {
          .trustvault-register-page .register-card {
            padding: 26px 20px !important;
          }
        }
      `}</style>

      <div className="register-card" style={s.card}>
        <Link to="/" style={s.back}>
          ← Back to Home
        </Link>

        <div style={s.icon}>👤</div>

        <h1 style={s.heading}>Create User Account</h1>

        <p style={s.subtitle}>
          Register to securely manage your documents.
        </p>

        <form onSubmit={handleRegister}>
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

          <div className="register-password-wrapper">
            <input
              className="register-password-input"
              style={s.input}
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              className="register-password-toggle"
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
            className="register-submit"
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
