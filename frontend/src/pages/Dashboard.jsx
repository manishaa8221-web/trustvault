
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/documents",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load documents");
        }

        const result = Array.isArray(data)
          ? data
          : data.documents || data.data?.documents || data.data || [];

        setDocuments(Array.isArray(result) ? result : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDocuments();
    } else {
      setLoading(false);
      setError("Please log in again.");
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/user-login");
  };

  const getDocumentName = (doc) =>
    doc.title || doc.name || "Untitled Document";

  const getDocumentDate = (doc) => {
    const date = doc.createdAt || doc.created_at;
    return date ? new Date(date).toLocaleDateString() : "Date unavailable";
  };

  const sharedDocuments = documents.filter(
    (doc) => Array.isArray(doc.permissions) && doc.permissions.length > 0
  );

  const recentDocuments = [...documents]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    )
    .slice(0, 5);

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>TrustVault</h2>
        <p style={styles.menuTitle}>WORKSPACE</p>

        <Link to="/dashboard" style={styles.activeLink}>
          ◈ Dashboard
        </Link>

        <Link to="/documents" style={styles.link}>
          ▣ My Documents
        </Link>

        <Link to="/documents" style={styles.link}>
          ⇄ Shared Documents
        </Link>

        <div style={styles.sidebarBottom}>
          <button onClick={handleLogout} style={styles.logout}>
            ↪ Logout
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.heading}>Dashboard</h1>
            <p style={styles.muted}>
              Welcome to your secure document workspace.
            </p>
          </div>

          <div style={styles.userBadge}>User Portal</div>
        </header>

        <section style={styles.welcome}>
          <div>
            <h2>Manage your documents securely.</h2>
            <p>
              Upload, organize and share your important documents
              from one place.
            </p>
          </div>

          <Link to="/documents" style={styles.primaryButton}>
            + Manage Documents
          </Link>
        </section>

        <section style={styles.stats}>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>▣</span>
            <p style={styles.statLabel}>Total Documents</p>
            <h2>{loading ? "..." : documents.length}</h2>
          </div>

          <div style={styles.statCard}>
            <span style={styles.statIcon}>⇄</span>
            <p style={styles.statLabel}>Shared Documents</p>
            <h2>{loading ? "..." : sharedDocuments.length}</h2>
          </div>

          <div style={styles.statCard}>
            <span style={styles.statIcon}>◷</span>
            <p style={styles.statLabel}>Recent Documents</p>
            <h2>{loading ? "..." : recentDocuments.length}</h2>
          </div>
        </section>

        <section style={styles.contentCard}>
          <div style={styles.sectionHeader}>
            <div>
              <h2>Recent Documents</h2>
              <p style={styles.muted}>
                Your latest document activity.
              </p>
            </div>

            <Link to="/documents" style={styles.viewAll}>
              View all →
            </Link>
          </div>

          {loading && <p>Loading documents...</p>}

          {error && <p style={styles.error}>{error}</p>}

          {!loading && !error && documents.length === 0 && (
            <div style={styles.empty}>
              <h3>No documents yet</h3>
              <p>Upload your first document to get started.</p>
              <Link to="/documents" style={styles.primaryButton}>
                Go to Documents
              </Link>
            </div>
          )}

          {!loading && !error && recentDocuments.length > 0 && (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Document Name</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Created Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentDocuments.map((doc, index) => (
                    <tr key={doc._id || doc.id || index}>
                      <td style={styles.td}>
                        ▤ {getDocumentName(doc)}
                      </td>
                      <td style={styles.td}>
                        {doc.category || "General"}
                      </td>
                      <td style={styles.td}>
                        {getDocumentDate(doc)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer style={styles.footer}>
          TrustVault © 2026 | Secure Document Management
        </footer>
      </main>
    </div>
  );
}

const styles = {
  layout: {
    minHeight: "100vh",
    display: "flex",
    background: "#f4f6fb",
    fontFamily: "Arial, sans-serif",
    color: "#202b40",
  },
  sidebar: {
    width: 245,
    background: "#172554",
    color: "white",
    padding: 25,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  logo: { fontSize: 25, marginBottom: 45 },
  menuTitle: {
    fontSize: 11,
    color: "#9eafd1",
    letterSpacing: 2,
    marginBottom: 15,
  },
  activeLink: {
    padding: 14,
    background: "#2d4378",
    color: "white",
    textDecoration: "none",
    borderRadius: 8,
    marginBottom: 10,
  },
  link: {
    padding: 14,
    color: "#d5def2",
    textDecoration: "none",
    borderRadius: 8,
    marginBottom: 10,
  },
  sidebarBottom: { marginTop: "auto" },
  logout: {
    width: "100%",
    padding: 13,
    background: "#293d70",
    color: "white",
    border: 0,
    borderRadius: 8,
    cursor: "pointer",
    textAlign: "left",
  },
  main: { flex: 1, padding: "30px 4%", minWidth: 0 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    marginBottom: 30,
  },
  heading: { margin: 0, fontSize: 28 },
  muted: { color: "#7b879b", fontSize: 14 },
  userBadge: {
    background: "#e6edff",
    color: "#2449a6",
    padding: "10px 17px",
    borderRadius: 20,
    fontSize: 13,
  },
  welcome: {
    background: "#2449a6",
    color: "white",
    borderRadius: 13,
    padding: 28,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 25,
  },
  primaryButton: {
    display: "inline-block",
    background: "#ffffff",
    color: "#2449a6",
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: 8,
    fontWeight: "bold",
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 18,
    marginBottom: 25,
  },
  statCard: {
    background: "white",
    padding: 22,
    borderRadius: 12,
    boxShadow: "0 3px 12px #00000008",
  },
  statIcon: { fontSize: 23, color: "#2449a6" },
  statLabel: { color: "#7b879b", fontSize: 14 },
  contentCard: {
    background: "white",
    borderRadius: 12,
    padding: 24,
    boxShadow: "0 3px 12px #00000008",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  },
  viewAll: { color: "#2449a6", textDecoration: "none" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 500 },
  th: {
    textAlign: "left",
    padding: 14,
    background: "#f5f7fb",
    color: "#68758b",
    fontSize: 13,
  },
  td: { padding: 15, borderBottom: "1px solid #edf0f5", fontSize: 14 },
  empty: { textAlign: "center", padding: 35 },
  error: { color: "#dc2626" },
  footer: {
    textAlign: "center",
    color: "#9aa4b5",
    fontSize: 12,
    marginTop: 30,
  },
};

export default Dashboard;
