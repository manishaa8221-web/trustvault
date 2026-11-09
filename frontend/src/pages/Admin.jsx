
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

export default function Admin() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load users");
      }

      setUsers(data.users || []);
    } catch (err) {
      setUsersError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load dashboard");
      }

      setStats(data.statistics || {});
      setLogs(data.recentLogs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");

    if (!token || role !== "ADMIN") {
      navigate("/admin-login");
      return;
    }

    fetchAdminData();
    fetchUsers();
  }, [navigate]);

  const changeUserStatus = async (user) => {
    const currentlyActive = user.isActive !== false;
    const newStatus = !currentlyActive;
    const action = newStatus ? "activate" : "deactivate";
    const displayName = user.name || user.username || user.email || "this user";

    if (!window.confirm(`Are you sure you want to ${action} ${displayName}?`)) {
      return;
    }

    try {
      setUpdatingUserId(user._id);
      setSuccessMessage("");
      setUsersError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/users/${user._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update account status");
      }

      setSuccessMessage(data.message || "Account status updated successfully.");

      await Promise.all([fetchUsers(), fetchAdminData()]);
    } catch (err) {
      setUsersError(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/admin-login");
  };

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.trim().toLowerCase();

    return (
      (user.name || "").toLowerCase().includes(search) ||
      (user.username || "").toLowerCase().includes(search) ||
      (user.email || "").toLowerCase().includes(search) ||
      (user.role || "").toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingIcon}>🔐</div>
        <h2>Loading TrustVault Admin...</h2>
        <p>Please wait while we prepare your dashboard.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>🔐</div>
          <div>
            <h1 style={styles.brandTitle}>TrustVault</h1>
            <p style={styles.brandSubtitle}>ADMINISTRATION CONSOLE</p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.adminBadge}>
            <span style={styles.onlineDot}></span>
            Administrator
          </div>

          <button onClick={logout} style={styles.logout}>
            ↪ Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <section style={styles.welcome}>
          <div>
            <p style={styles.eyebrow}>PLATFORM CONTROL CENTER</p>
            <h2 style={styles.welcomeTitle}>Welcome, Administrator</h2>
            <p style={styles.welcomeText}>
              Monitor users, manage documents and review security activity
              across TrustVault.
            </p>
          </div>

          <button
            onClick={() => {
              fetchAdminData();
              fetchUsers();
            }}
            style={styles.refreshButton}
          >
            ↻ Refresh Dashboard
          </button>
        </section>

        {error && <p style={styles.error}>{error}</p>}

        <section>
          <div style={styles.sectionHeading}>
            <div>
              <p style={styles.eyebrow}>AT A GLANCE</p>
              <h2 style={styles.sectionTitle}>Platform Overview</h2>
            </div>
          </div>

          <div style={styles.grid}>
            <Stat icon="👥" title="Total Users" value={stats?.totalUsers ?? 0} color="#6256bd" background="#eeecff" />
            <Stat icon="🟢" title="Active Users" value={stats?.activeUsers ?? 0} color="#16845b" background="#e4f7ee" />
            <Stat icon="🛡️" title="Administrators" value={stats?.totalAdmins ?? 0} color="#2879b8" background="#e7f2fc" />
            <Stat icon="📁" title="Total Documents" value={stats?.totalDocuments ?? 0} color="#b47724" background="#fff4df" />
            <Stat icon="📋" title="Audit Logs" value={stats?.totalLogs ?? 0} color="#a34b8c" background="#f9eaf5" />
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.eyebrow}>DOCUMENT CONTROL</p>
              <h2 style={styles.sectionTitle}>Document Management</h2>
              <p style={styles.sectionDescription}>
                Access and manage documents uploaded by your administrator
                account.
              </p>
            </div>
            <div style={styles.largeIcon}>📂</div>
          </div>

          <button
            onClick={() => navigate("/documents")}
            style={styles.documentButton}
          >
            Manage My Documents <span>→</span>
          </button>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.eyebrow}>ACCOUNT CONTROL</p>
              <h2 style={styles.sectionTitle}>User Management</h2>
              <p style={styles.sectionDescription}>
                Search registered users and manage their account status.
              </p>
            </div>
            <div style={styles.largeIcon}>👤</div>
          </div>

          <input
            type="text"
            placeholder="Search by username, name, email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.search}
          />

          {successMessage && <p style={styles.success}>{successMessage}</p>}

          {usersLoading ? (
            <p style={styles.muted}>Loading users...</p>
          ) : usersError ? (
            <p style={styles.error}>{usersError}</p>
          ) : (
            <>
              <p style={styles.userCount}>
                Showing {filteredUsers.length} of {users.length} users
              </p>

              {filteredUsers.length === 0 ? (
                <p style={styles.muted}>No matching users found.</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>User</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Role</th>
                        <th style={styles.th}>Registered</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map((user) => {
                        const isActive = user.isActive !== false;
                        const isAdmin = user.role === "ADMIN";

                        return (
                          <tr key={user._id}>
                            <td style={styles.td}>
                              <div style={styles.userCell}>
                                <div style={styles.avatar}>
                                  {(user.name || user.username || user.email || "U")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <strong>{user.name || user.username || "-"}</strong>
                              </div>
                            </td>

                            <td style={styles.td}>{user.email || "-"}</td>

                            <td style={styles.td}>
                              <span style={styles.role}>{user.role || "-"}</span>
                            </td>

                            <td style={styles.td}>
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : "-"}
                            </td>

                            <td style={styles.td}>
                              <span style={isActive ? styles.activeStatus : styles.inactiveStatus}>
                                {isActive ? "● Active" : "● Deactivated"}
                              </span>
                            </td>

                            <td style={styles.td}>
                              {isAdmin ? (
                                <span style={styles.protectedText}>Protected</span>
                              ) : (
                                <button
                                  onClick={() => changeUserStatus(user)}
                                  disabled={updatingUserId === user._id}
                                  style={isActive ? styles.deactivateButton : styles.activateButton}
                                >
                                  {updatingUserId === user._id
                                    ? "Updating..."
                                    : isActive
                                    ? "Deactivate"
                                    : "Activate"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <p style={styles.eyebrow}>SECURITY MONITORING</p>
              <h2 style={styles.sectionTitle}>Recent Activity</h2>
              <p style={styles.sectionDescription}>
                Review recorded actions performed on the platform.
              </p>
            </div>
            <div style={styles.largeIcon}>🛡️</div>
          </div>

          {logs.length === 0 ? (
            <p style={styles.muted}>No recent activity available.</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Action</th>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Details</th>
                    <th style={styles.th}>Date & Time</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log._id || index}>
                      <td style={styles.td}>
                        <span style={styles.actionBadge}>{log.action || "-"}</span>
                      </td>
                      <td style={styles.td}>
                        {log.user?.email || log.user?.username || log.user?.name || "-"}
                      </td>
                      <td style={styles.td}>{log.details || "-"}</td>
                      <td style={styles.td}>
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer style={styles.footer}>
          TrustVault Administration Console · Secure Document Management · 2026
        </footer>
      </main>
    </div>
  );
}

function Stat({ icon, title, value, color, background }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, color, background }}>{icon}</div>
      <p style={styles.statTitle}>{title}</p>
      <h2 style={styles.statValue}>{value}</h2>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f3f4fa", fontFamily: "Arial, sans-serif", color: "#20243a" },
  loadingPage: { minHeight: "100vh", display: "grid", placeContent: "center", textAlign: "center", background: "#f3f4fa", fontFamily: "Arial, sans-serif", color: "#282344" },
  loadingIcon: { fontSize: 42, marginBottom: 12 },
  header: { background: "linear-gradient(115deg, #17152f, #30245b, #45316e)", color: "white", padding: "20px 5%", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 15, boxShadow: "0 5px 25px #17152f30" },
  brand: { display: "flex", alignItems: "center", gap: 13 },
  brandIcon: { width: 48, height: 48, borderRadius: 13, background: "#ffffff1c", display: "grid", placeItems: "center", fontSize: 25 },
  brandTitle: { margin: 0, fontSize: 25, letterSpacing: 0.5 },
  brandSubtitle: { margin: "5px 0 0", fontSize: 10, letterSpacing: 2, color: "#d2c9ed" },
  headerRight: { display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" },
  adminBadge: { display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", background: "#ffffff17", border: "1px solid #ffffff25", borderRadius: 20, fontSize: 13 },
  onlineDot: { width: 8, height: 8, background: "#5ee0a0", borderRadius: "50%" },
  logout: { padding: "10px 17px", border: "1px solid #ffffff35", borderRadius: 8, background: "#e45b69", color: "white", cursor: "pointer", fontWeight: "bold" },
  main: { maxWidth: 1450, margin: "auto", padding: "32px 5%" },
  welcome: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, marginBottom: 35 },
  eyebrow: { color: "#7868b6", fontSize: 10, fontWeight: "bold", letterSpacing: 2, margin: "0 0 9px" },
  welcomeTitle: { fontSize: 28, color: "#26213e", margin: "0 0 9px" },
  welcomeText: { color: "#77768a", fontSize: 14, lineHeight: 1.7, margin: 0, maxWidth: 650 },
  refreshButton: { padding: "12px 18px", background: "#ffffff", color: "#45316e", border: "1px solid #ded9ed", borderRadius: 9, fontWeight: "bold", cursor: "pointer" },
  sectionHeading: { marginBottom: 18 },
  sectionTitle: { fontSize: 21, color: "#292440", margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 17, marginTop: 18 },
  statCard: { background: "#ffffff", padding: 21, borderRadius: 13, boxShadow: "0 4px 18px #2520440a", border: "1px solid #eceaf3" },
  statIcon: { width: 43, height: 43, borderRadius: 12, display: "grid", placeItems: "center", fontSize: 20, marginBottom: 15 },
  statTitle: { color: "#77768a", fontSize: 13, margin: "0 0 8px" },
  statValue: { fontSize: 29, color: "#292440", margin: 0 },
  section: { background: "#ffffff", marginTop: 26, padding: 25, borderRadius: 14, border: "1px solid #eceaf3", boxShadow: "0 4px 18px #2520440a" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, marginBottom: 20 },
  sectionDescription: { color: "#858397", fontSize: 13, lineHeight: 1.7, margin: "8px 0 0" },
  largeIcon: { width: 48, height: 48, borderRadius: 13, background: "#f0edfa", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 },
  documentButton: { padding: "12px 19px", border: 0, borderRadius: 8, background: "#493477", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: 14 },
  search: { width: "100%", maxWidth: 470, padding: 13, margin: "5px 0 17px", border: "1px solid #dedce8", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outlineColor: "#7662b4" },
  userCount: { color: "#77768a", fontSize: 13, marginBottom: 14 },
  tableWrapper: { width: "100%", overflowX: "auto" },
  table: { width: "100%", minWidth: 720, borderCollapse: "collapse", textAlign: "left" },
  th: { padding: "14px 12px", background: "#f5f3fa", color: "#5b5275", fontSize: 12, fontWeight: "bold", borderBottom: "1px solid #e9e5f1", whiteSpace: "nowrap" },
  td: { padding: "15px 12px", fontSize: 13, color: "#55546a", borderBottom: "1px solid #efedf4", verticalAlign: "middle" },
  userCell: { display: "flex", alignItems: "center", gap: 10, color: "#302b47" },
  avatar: { width: 32, height: 32, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", background: "#eeeafa", color: "#58428b", fontWeight: "bold" },
  role: { background: "#eeeafa", color: "#59438a", padding: "6px 10px", borderRadius: 20, fontSize: 11, fontWeight: "bold" },
  activeStatus: { background: "#e4f7ed", color: "#16845b", padding: "6px 10px", borderRadius: 20, fontSize: 11, fontWeight: "bold", whiteSpace: "nowrap" },
  inactiveStatus: { background: "#ffebed", color: "#bd4050", padding: "6px 10px", borderRadius: 20, fontSize: 11, fontWeight: "bold", whiteSpace: "nowrap" },
  activateButton: { padding: "8px 12px", border: 0, borderRadius: 6, background: "#16845b", color: "white", cursor: "pointer", fontSize: 12 },
  deactivateButton: { padding: "8px 12px", border: 0, borderRadius: 6, background: "#d94d5b", color: "white", cursor: "pointer", fontSize: 12 },
  protectedText: { color: "#8b879b", fontSize: 12, fontWeight: "bold" },
  actionBadge: { display: "inline-block", background: "#f0edfa", color: "#59438a", padding: "6px 9px", borderRadius: 6, fontSize: 11, fontWeight: "bold", whiteSpace: "nowrap" },
  muted: { color: "#858397", fontSize: 14 },
  error: { color: "#b42335", background: "#ffebed", padding: 12, borderRadius: 8, fontSize: 13 },
  success: { color: "#166b48", background: "#e4f7ed", padding: 12, borderRadius: 8, fontSize: 13 },
  footer: { textAlign: "center", color: "#9692a5", fontSize: 12, padding: "35px 10px 15px" },
};
