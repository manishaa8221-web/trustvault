
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
  const [refreshing, setRefreshing] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError("");

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  const refreshDashboard = async () => {
    setRefreshing(true);

    await Promise.all([
      fetchAdminData(),
      fetchUsers(),
    ]);

    setRefreshing(false);
  };

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

      setSuccessMessage(
        data.message || "Account status updated successfully."
      );

      await Promise.all([
        fetchUsers(),
        fetchAdminData(),
      ]);
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
        <p>Preparing your secure dashboard.</p>
      </div>
    );
  }

  const statCards = [
    {
      icon: "👥",
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      color: "#a78bfa",
    },
    {
      icon: "🟢",
      title: "Active Users",
      value: stats?.activeUsers ?? 0,
      color: "#34d399",
      subtitle: "Logged in during last 30 days",
    },
    {
      icon: "🛡️",
      title: "Administrators",
      value: stats?.totalAdmins ?? 0,
      color: "#60a5fa",
    },
    {
      icon: "📁",
      title: "Total Documents",
      value: stats?.totalDocuments ?? 0,
      color: "#fbbf24",
    },
    {
      icon: "🔗",
      title: "Shared Documents",
      value: stats?.totalSharedDocuments ?? 0,
      color: "#38bdf8",
    },
    {
      icon: "🚫",
      title: "Revoked Permissions",
      value: stats?.totalRevokedPermissions ?? 0,
      color: "#fb7185",
    },
    {
      icon: "📋",
      title: "Audit Logs",
      value: stats?.totalLogs ?? 0,
      color: "#c084fc",
    },
  ];

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
              across your TrustVault platform.
            </p>
          </div>

          <button
            onClick={refreshDashboard}
            disabled={refreshing}
            style={styles.refreshButton}
          >
            {refreshing ? "↻ Refreshing..." : "↻ Refresh Dashboard"}
          </button>
        </section>

        {error && <p style={styles.error}>{error}</p>}

        <section>
          <div style={styles.sectionHeading}>
            <div>
              <p style={styles.eyebrow}>AT A GLANCE</p>
              <h2 style={styles.sectionTitle}>Platform Overview</h2>
              <p style={styles.sectionDescription}>
                Important statistics and security metrics from your platform.
              </p>
            </div>
          </div>

          <div style={styles.grid}>
            {statCards.map((item) => (
              <Stat
                key={item.title}
                icon={item.icon}
                title={item.title}
                value={item.value}
                color={item.color}
                subtitle={item.subtitle}
              />
            ))}
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
            style={styles.primaryButton}
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
            placeholder="Search by name, email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.search}
          />

          {successMessage && (
            <p style={styles.success}>{successMessage}</p>
          )}

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

                                <strong>
                                  {user.name || user.username || "-"}
                                </strong>
                              </div>
                            </td>

                            <td style={styles.td}>{user.email || "-"}</td>

                            <td style={styles.td}>
                              <span style={styles.role}>
                                {user.role || "-"}
                              </span>
                            </td>

                            <td style={styles.td}>
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : "-"}
                            </td>

                            <td style={styles.td}>
                              <span
                                style={
                                  isActive
                                    ? styles.activeStatus
                                    : styles.inactiveStatus
                                }
                              >
                                {isActive ? "● Active" : "● Deactivated"}
                              </span>
                            </td>

                            <td style={styles.td}>
                              {isAdmin ? (
                                <span style={styles.protectedText}>
                                  Protected
                                </span>
                              ) : (
                                <button
                                  onClick={() => changeUserStatus(user)}
                                  disabled={updatingUserId === user._id}
                                  style={
                                    isActive
                                      ? styles.deactivateButton
                                      : styles.activateButton
                                  }
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
                Review the latest recorded actions performed on TrustVault.
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
                    <th style={styles.th}>Document</th>
                    <th style={styles.th}>Details</th>
                    <th style={styles.th}>Date & Time</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log._id || index}>
                      <td style={styles.td}>
                        <span style={styles.actionBadge}>
                          {log.action || "-"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {log.user?.email ||
                          log.user?.username ||
                          log.user?.name ||
                          "-"}
                      </td>

                      <td style={styles.td}>
                        {log.document?.title || "-"}
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

function Stat({ icon, title, value, color, subtitle }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, color }}>
        {icon}
      </div>

      <p style={styles.statTitle}>{title}</p>

      <h2 style={styles.statValue}>
        {Number(value).toLocaleString()}
      </h2>

      {subtitle && <p style={styles.statSubtitle}>{subtitle}</p>}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#080d1b",
    fontFamily: "Arial, sans-serif",
    color: "#f1f0fa",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "grid",
    placeContent: "center",
    textAlign: "center",
    background: "#080d1b",
    color: "#f1f0fa",
    fontFamily: "Arial, sans-serif",
  },

  loadingIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  header: {
    background: "linear-gradient(115deg, #10172c, #211943, #30205a)",
    color: "white",
    padding: "20px 5%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 15,
    borderBottom: "1px solid #302750",
    boxShadow: "0 5px 25px #00000040",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 13,
  },

  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    background: "#ffffff18",
    display: "grid",
    placeItems: "center",
    fontSize: 25,
  },

  brandTitle: {
    margin: 0,
    fontSize: 25,
    letterSpacing: 0.5,
  },

  brandSubtitle: {
    margin: "5px 0 0",
    fontSize: 10,
    letterSpacing: 2,
    color: "#c4b5fd",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
  },

  adminBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "9px 13px",
    background: "#ffffff12",
    border: "1px solid #ffffff25",
    borderRadius: 20,
    fontSize: 13,
  },

  onlineDot: {
    width: 8,
    height: 8,
    background: "#34d399",
    borderRadius: "50%",
  },

  logout: {
    padding: "10px 17px",
    border: "1px solid #fb718555",
    borderRadius: 8,
    background: "#be4057",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },

  main: {
    maxWidth: 1450,
    margin: "auto",
    padding: "32px 5%",
  },

  welcome: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 35,
  },

  eyebrow: {
    color: "#a78bfa",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 2,
    margin: "0 0 9px",
  },

  welcomeTitle: {
    fontSize: 28,
    color: "#f5f3ff",
    margin: "0 0 9px",
  },

  welcomeText: {
    color: "#a6a2bc",
    fontSize: 14,
    lineHeight: 1.7,
    margin: 0,
    maxWidth: 650,
  },

  refreshButton: {
    padding: "12px 18px",
    background: "#211a3a",
    color: "#d8ccff",
    border: "1px solid #55427d",
    borderRadius: 9,
    fontWeight: "bold",
    cursor: "pointer",
  },

  sectionHeading: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 21,
    color: "#f1edff",
    margin: 0,
  },

  sectionDescription: {
    color: "#9994b0",
    fontSize: 13,
    lineHeight: 1.7,
    margin: "8px 0 0",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 17,
    marginTop: 18,
  },

  statCard: {
    background: "linear-gradient(145deg, #151b30, #111729)",
    padding: 21,
    borderRadius: 13,
    border: "1px solid #292d49",
    boxShadow: "0 5px 20px #00000020",
    minWidth: 0,
  },

  statIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    background: "#282143",
    display: "grid",
    placeItems: "center",
    fontSize: 20,
    marginBottom: 15,
  },

  statTitle: {
    color: "#aaa5c1",
    fontSize: 13,
    margin: "0 0 8px",
  },

  statValue: {
    fontSize: 29,
    color: "#f5f3ff",
    margin: 0,
  },

  statSubtitle: {
    color: "#827d99",
    fontSize: 10,
    lineHeight: 1.5,
    margin: "8px 0 0",
  },

  section: {
    background: "#111729",
    marginTop: 26,
    padding: 25,
    borderRadius: 14,
    border: "1px solid #292d49",
    boxShadow: "0 4px 18px #00000020",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
  },

  largeIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    background: "#282143",
    display: "grid",
    placeItems: "center",
    fontSize: 22,
    flexShrink: 0,
  },

  primaryButton: {
    padding: "12px 19px",
    border: 0,
    borderRadius: 8,
    background: "linear-gradient(110deg, #7044c5, #9859db)",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: 14,
  },

  search: {
    width: "100%",
    maxWidth: 470,
    padding: 13,
    margin: "5px 0 17px",
    border: "1px solid #34334f",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
    outlineColor: "#9874e8",
    background: "#0b1120",
    color: "#f1f0fa",
  },

  userCount: {
    color: "#aaa5c1",
    fontSize: 13,
    marginBottom: 14,
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: 760,
    borderCollapse: "collapse",
    textAlign: "left",
  },

  th: {
    padding: "14px 12px",
    background: "#201c37",
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "bold",
    borderBottom: "1px solid #34304e",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "15px 12px",
    fontSize: 13,
    color: "#c2bfd2",
    borderBottom: "1px solid #272d43",
    verticalAlign: "middle",
  },

  userCell: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#eeeaff",
  },

  avatar: {
    width: 32,
    height: 32,
    flexShrink: 0,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#342657",
    color: "#d8c8ff",
    fontWeight: "bold",
  },

  role: {
    background: "#30264d",
    color: "#c4b5fd",
    padding: "6px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: "bold",
  },

  activeStatus: {
    background: "#123b32",
    color: "#6ee7b7",
    padding: "6px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  inactiveStatus: {
    background: "#48232f",
    color: "#fda4af",
    padding: "6px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  activateButton: {
    padding: "8px 12px",
    border: 0,
    borderRadius: 6,
    background: "#16845b",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
  },

  deactivateButton: {
    padding: "8px 12px",
    border: 0,
    borderRadius: 6,
    background: "#bd4055",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
  },

  protectedText: {
    color: "#9994b0",
    fontSize: 12,
    fontWeight: "bold",
  },

  actionBadge: {
    display: "inline-block",
    background: "#30264d",
    color: "#d0bcff",
    padding: "6px 9px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  muted: {
    color: "#9994b0",
    fontSize: 14,
  },

  error: {
    color: "#fda4af",
    background: "#421f2c",
    border: "1px solid #783344",
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
  },

  success: {
    color: "#6ee7b7",
    background: "#123b32",
    border: "1px solid #21634e",
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
  },

  footer: {
    textAlign: "center",
    color: "#77738f",
    fontSize: 12,
    padding: "35px 10px 15px",
  },
};
