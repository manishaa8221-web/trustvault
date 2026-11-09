
import { Link } from "react-router-dom";

export default function LoginSelection() {
  return (
    <div style={s.page}>
      <header style={s.header}>
        <h2 style={s.logo}>TrustVault</h2>
        <span style={s.tagline}>
          Secure Document Management
        </span>
      </header>

      <main style={s.main}>
        <div style={s.intro}>
          <div style={s.icon}>🔐</div>
          <h1>Welcome to TrustVault</h1>
          <p>
            Your secure space to upload, manage and
            share important documents.
          </p>
        </div>

        <div style={s.card}>
          <div style={s.userIcon}>U</div>

          <h2>User Portal</h2>

          <p>
            Access, manage and share your documents
            securely from anywhere.
          </p>

          <Link to="/user-login" style={s.loginButton}>
            User Login
          </Link>

          <div style={s.registerArea}>
            New to TrustVault?
            <Link to="/register" style={s.registerLink}>
              Create a User Account
            </Link>
          </div>
        </div>
      </main>

      <footer style={s.footer}>
        © 2026 TrustVault. Secure access for everyone.
      </footer>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    fontFamily: "Arial, sans-serif",
    color: "#17233c",
  },

  header: {
    height: 75,
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 8%",
    boxShadow: "0 2px 10px #0000000d",
  },

  logo: {
    color: "#2449a6",
    fontSize: 25,
  },

  tagline: {
    color: "#68758b",
    fontSize: 14,
  },

  main: {
    maxWidth: 650,
    margin: "auto",
    padding: "65px 20px",
  },

  intro: {
    textAlign: "center",
    marginBottom: 35,
  },

  icon: {
    fontSize: 45,
    marginBottom: 15,
  },

  card: {
    background: "white",
    borderRadius: 18,
    padding: "40px 35px",
    textAlign: "center",
    boxShadow: "0 8px 30px #1e293b12",
  },

  userIcon: {
    background: "#e8efff",
    color: "#2449a6",
    width: 60,
    height: 60,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    margin: "auto",
    fontSize: 25,
    fontWeight: "bold",
  },

  loginButton: {
    display: "block",
    background: "#2449a6",
    color: "white",
    padding: 14,
    borderRadius: 8,
    textDecoration: "none",
    marginTop: 25,
    fontWeight: "bold",
  },

  registerArea: {
    marginTop: 25,
    color: "#68758b",
    fontSize: 14,
  },

  registerLink: {
    display: "block",
    marginTop: 10,
    color: "#2449a6",
    textDecoration: "none",
    fontWeight: "bold",
  },

  footer: {
    textAlign: "center",
    padding: 20,
    color: "#7b8798",
    fontSize: 13,
  },
};
