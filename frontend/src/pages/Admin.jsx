import { Link } from "react-router-dom";

function Admin() {
  return (
    <div style={{ padding: "30px" }}>
      <h1>🛡️ Admin Dashboard</h1>

      <p>Total Users: 1</p>
      <p>Total Documents: 3</p>
      <p>Total Logs: 5</p>

      <p>Admin Access Granted</p>

      <br />

      <Link to="/dashboard">
        ← Back to Dashboard
      </Link>
    </div>
  );
}

export default Admin;