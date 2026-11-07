import { useNavigate, Link } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "600px",
        margin: "auto",
        textAlign: "center",
      }}
    >
      <h1>🚀 TrustVault Dashboard</h1>

      <p>User Logged In Successfully</p>

      <div
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          marginTop: "30px",
        }}
      >
        <Link
          to="/documents"
          style={{
            padding: "12px 20px",
            backgroundColor: "#2563eb",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
          }}
        >
          📄 Documents
        </Link>

        <Link
          to="/admin"
          style={{
            padding: "12px 20px",
            backgroundColor: "#16a34a",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
          }}
        >
          🛡️ Admin
        </Link>
      </div>

      <br />
      <br />

      <button
        onClick={logout}
        style={{
          padding: "10px 20px",
          backgroundColor: "#dc2626",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;