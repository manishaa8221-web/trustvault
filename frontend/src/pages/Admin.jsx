
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

export default function Admin() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("ALL");

  const [selectedUsers, setSelectedUsers] = useState({});
  const [selectedAccess, setSelectedAccess] = useState({});

  const [error, setError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [documentsError, setDocumentsError] = useState("");
  const [activityError, setActivityError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [updatingDocumentId, setUpdatingDocumentId] = useState(null);

  // COMMON API HEADERS
  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  // FORMAT DATE AND TIME IN INDIAN STANDARD TIME
  const formatIST = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "-";

    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(parsedDate) + " IST";
  };

  // LOAD DASHBOARD STATISTICS
  const fetchAdminData = async () => {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/dashboard`,
        { headers: getHeaders() }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load dashboard");
      }

      setStats(data.statistics || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // LOAD ALL USERS
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/users`,
        { headers: getHeaders() }
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

  // LOAD ALL DOCUMENTS IN THE SYSTEM
  const fetchDocuments = async () => {
    try {
      setDocumentsLoading(true);
      setDocumentsError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/documents`,
        { headers: getHeaders() }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load documents");
      }

      setDocuments(
        Array.isArray(data.documents)
          ? data.documents
          : []
      );
    } catch (err) {
      setDocumentsError(err.message);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // LOAD SYSTEM-WIDE ACTIVITY
  const fetchActivityLogs = async () => {
    try {
      setActivityLoading(true);
      setActivityError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/audit-logs?page=1&limit=100`,
        { headers: getHeaders() }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load activity");
      }

      setLogs(data.logs || []);
    } catch (err) {
      setActivityError(err.message);
    } finally {
      setActivityLoading(false);
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    const role = localStorage.getItem("userRole");

    if (!token || role !== "ADMIN") {
      navigate("/admin-login");
      return;
    }

    fetchAdminData();
    fetchUsers();
    fetchDocuments();
    fetchActivityLogs();
  }, [navigate]);

  // REFRESH ALL ADMIN DATA
  const refreshDashboard = async () => {
    setRefreshing(true);

    await Promise.all([
      fetchAdminData(),
      fetchUsers(),
      fetchDocuments(),
      fetchActivityLogs(),
    ]);

    setRefreshing(false);
  };

  // ACTIVATE OR DEACTIVATE USER
  const changeUserStatus = async (user) => {
    const currentlyActive = user.isActive !== false;
    const newStatus = !currentlyActive;

    const action = newStatus ? "activate" : "deactivate";

    const displayName =
      user.name || user.username || user.email || "this user";

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
          headers: getHeaders(),
          body: JSON.stringify({ isActive: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update user");
      }

      setSuccessMessage(
        data.message || "User status updated successfully."
      );

      await Promise.all([
        fetchUsers(),
        fetchAdminData(),
        fetchActivityLogs(),
      ]);
    } catch (err) {
      setUsersError(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ADMIN GRANTS OR REVOKES DOCUMENT ACCESS
  const changeDocumentAccess = async (document) => {
    const documentId = document._id;
    const userId = selectedUsers[documentId];
    const access = selectedAccess[documentId] || "READ";

    if (!userId) {
      setDocumentsError("Please select a user first.");
      return;
    }

    const selectedUser = users.find(
      (user) => user._id === userId
    );

    const documentName = document.title || "this document";

    const accessLabel =
      access === "NO ACCESS"
        ? "revoke access to"
        : `grant ${access} access to`;

    const userName =
      selectedUser?.name || selectedUser?.email || "this user";

    if (
      !window.confirm(
        `Are you sure you want to ${accessLabel} "${documentName}" for ${userName}?`
      )
    ) {
      return;
    }

    try {
      setUpdatingDocumentId(documentId);
      setDocumentsError("");
      setSuccessMessage("");

      const response = await fetch(
        `${API_BASE_URL}/admin/documents/${documentId}/access`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            userId,
            access,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update document access"
        );
      }

      setSuccessMessage(
        data.message ||
          `Document access updated to ${access} successfully.`
      );

      await Promise.all([
        fetchDocuments(),
        fetchActivityLogs(),
        fetchAdminData(),
      ]);
    } catch (err) {
      setDocumentsError(err.message);
    } finally {
      setUpdatingDocumentId(null);
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/admin-login");
  };

  // SEARCH USERS
  const filteredUsers = users.filter((user) => {
    const search = searchTerm.trim().toLowerCase();

    return (
      (user.name || "").toLowerCase().includes(search) ||
      (user.username || "").toLowerCase().includes(search) ||
      (user.email || "").toLowerCase().includes(search) ||
      (user.role || "").toLowerCase().includes(search)
    );
  });

  // SEARCH DOCUMENTS
  const filteredDocuments = documents.filter((document) => {
    const search = documentSearch.trim().toLowerCase();

    return (
      (document.title || "").toLowerCase().includes(search) ||
      (document.category || "").toLowerCase().includes(search) ||
      (document.owner?.name || "").toLowerCase().includes(search) ||
      (document.owner?.email || "").toLowerCase().includes(search)
    );
  });

  // FILTER ACTIVITY
  const filteredLogs = logs.filter((log) => {
    const matchesAction =
      activityFilter === "ALL" || log.action === activityFilter;

    const search = activitySearch.trim().toLowerCase();

    const matchesSearch =
      (log.user?.name || "").toLowerCase().includes(search) ||
      (log.user?.email || "").toLowerCase().includes(search) ||
      (log.document?.title || "").toLowerCase().includes(search) ||
      (log.action || "").toLowerCase().includes(search);

    return matchesAction && matchesSearch;
  });

  // DOCUMENT PERMISSION HELPER
  const getPermission = (document, userId) => {
    const permission = document.permissions?.find((item) => {
      const permissionUser =
        typeof item.user === "object"
          ? item.user?._id
          : item.user;

      return String(permissionUser) === String(userId);
    });

    return permission?.access || "NO ACCESS";
  };

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

  const activityTypes = [
    ...new Set(logs.map((log) => log.action).filter(Boolean)),
  ];

  return (
    <div style={styles.page}>
      {/* HEADER */}
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
        {/* WELCOME */}
        <section style={styles.welcome}>
          <div>
            <p style={styles.eyebrow}>PLATFORM CONTROL CENTER</p>

            <h2 style={styles.welcomeTitle}>
              Welcome, Administrator
            </h2>

            <p style={styles.welcomeText}>
              Monitor users, manage documents, control permissions
              and review security activity across TrustVault.
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

        {successMessage && (
          <p style={styles.success}>{successMessage}</p>
        )}

        {/* PLATFORM STATISTICS */}
        <section>
          <div style={styles.sectionHeading}>
            <p style={styles.eyebrow}>AT A GLANCE</p>
            <h2 style={styles.sectionTitle}>Platform Overview</h2>

            <p style={styles.sectionDescription}>
              Important statistics and security metrics from your platform.
            </p>
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

        {/* USER MANAGEMENT */}
        <section style={styles.section}>
          <SectionHeading
            eyebrow="ACCOUNT CONTROL"
            title="User Management"
            description="Search registered users and manage their account status."
            icon="👤"
          />

          <input
            type="text"
            placeholder="Search by name, email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.search}
          />

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
                                  {(user.name || user.email || "U")
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
                              {formatIST(user.createdAt)}
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

        {/* DOCUMENT MANAGEMENT AND ACCESS CONTROL */}
        <section style={styles.section}>
          <SectionHeading
            eyebrow="DOCUMENT CONTROL"
            title="All Documents & Access Management"
            description="View documents belonging to all owners and manage user permissions."
            icon="📂"
          />

          <input
            type="text"
            placeholder="Search by document, category or owner..."
            value={documentSearch}
            onChange={(e) => setDocumentSearch(e.target.value)}
            style={styles.search}
          />

          {documentsLoading ? (
            <p style={styles.muted}>Loading all documents...</p>
          ) : documentsError ? (
            <p style={styles.error}>{documentsError}</p>
          ) : filteredDocuments.length === 0 ? (
            <p style={styles.muted}>No documents found.</p>
          ) : (
            <>
              <p style={styles.userCount}>
                Showing {filteredDocuments.length} of {documents.length} documents
              </p>

              <div style={styles.documentGrid}>
                {filteredDocuments.map((document) => {
                  const documentId = document._id;

                  const eligibleUsers = users.filter(
                    (user) =>
                      user.role !== "ADMIN" &&
                      String(user._id) !== String(
                        typeof document.owner === "object"
                          ? document.owner?._id
                          : document.owner
                      )
                  );

                  const permissionUsers = users.filter(
                    (user) =>
                      getPermission(document, user._id) !== "NO ACCESS"
                  );

                  return (
                    <div key={documentId} style={styles.documentCard}>
                      <div style={styles.documentTop}>
                        <div style={styles.documentIcon}>📄</div>

                        <span style={styles.categoryBadge}>
                          {document.category || "General"}
                        </span>
                      </div>

                      <h3 style={styles.documentTitle}>
                        {document.title || "Untitled Document"}
                      </h3>

                      <p style={styles.documentInfo}>
                        Owner:{" "}
                        {document.owner?.name ||
                          document.owner?.email ||
                          "Unknown"}
                      </p>

                      <p style={styles.documentInfo}>
                        Created: {formatIST(document.createdAt)}
                      </p>

                      <p style={styles.documentInfo}>
                        Current shared users: {permissionUsers.length}
                      </p>

                      <div style={styles.permissionList}>
                        <strong style={styles.permissionHeading}>
                          Current permissions
                        </strong>

                        {permissionUsers.length === 0 ? (
                          <p style={styles.muted}>Not shared with anyone.</p>
                        ) : (
                          permissionUsers.map((user) => (
                            <div
                              key={user._id}
                              style={styles.permissionRow}
                            >
                              <span>{user.name || user.email}</span>
                              <span style={styles.permissionBadge}>
                                {getPermission(document, user._id)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div style={styles.accessControls}>
                        <label style={styles.fieldLabel}>
                          Select user
                        </label>

                        <select
                          value={selectedUsers[documentId] || ""}
                          onChange={(e) =>
                            setSelectedUsers((previous) => ({
                              ...previous,
                              [documentId]: e.target.value,
                            }))
                          }
                          style={styles.select}
                        >
                          <option value="">Choose a user</option>

                          {eligibleUsers.map((user) => (
                            <option key={user._id} value={user._id}>
                              {user.name || user.email} ({user.role})
                            </option>
                          ))}
                        </select>

                        <label style={styles.fieldLabel}>
                          Access permission
                        </label>

                        <select
                          value={selectedAccess[documentId] || "READ"}
                          onChange={(e) =>
                            setSelectedAccess((previous) => ({
                              ...previous,
                              [documentId]: e.target.value,
                            }))
                          }
                          style={styles.select}
                        >
                          <option value="READ">READ - View document</option>
                          <option value="EDIT">EDIT - Edit document</option>
                          <option value="NO ACCESS">NO ACCESS - Revoke</option>
                        </select>

                        <button
                          onClick={() => changeDocumentAccess(document)}
                          disabled={
                            updatingDocumentId === documentId ||
                            eligibleUsers.length === 0
                          }
                          style={styles.accessButton}
                        >
                          {updatingDocumentId === documentId
                            ? "Updating access..."
                            : "Update Access"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* SYSTEM ACTIVITY HISTORY */}
        <section style={styles.section}>
          <SectionHeading
            eyebrow="SECURITY MONITORING"
            title="System Activity History"
            description="See who viewed, downloaded, edited, shared or revoked documents and when."
            icon="🛡️"
          />

          <div style={styles.filterRow}>
            <input
              type="text"
              placeholder="Search user, document or action..."
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              style={styles.search}
            />

            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">All activities</option>

              {activityTypes.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          {activityLoading ? (
            <p style={styles.muted}>Loading system activity...</p>
          ) : activityError ? (
            <p style={styles.error}>{activityError}</p>
          ) : filteredLogs.length === 0 ? (
            <p style={styles.muted}>No matching activity found.</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Action</th>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Document</th>
                    <th style={styles.th}>Details</th>
                    <th style={styles.th}>Date & Time (IST)</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log, index) => (
                    <tr key={log._id || index}>
                      <td style={styles.td}>
                        <span style={styles.actionBadge}>
                          {log.action || "-"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {log.user?.name ||
                          log.user?.email ||
                          "Unknown user"}
                      </td>

                      <td style={styles.td}>
                        {log.document?.title || "No document"}
                      </td>

                      <td style={styles.td}>
                        {log.details || "-"}
                      </td>

                      <td style={styles.td}>
                        {formatIST(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p style={styles.timeNote}>
            All displayed timestamps use Asia/Kolkata (IST).
          </p>
        </section>

        <footer style={styles.footer}>
          TrustVault Administration Console · Secure Document Management · 2026
        </footer>
      </main>
    </div>
  );
}

// REUSABLE SECTION HEADING
function SectionHeading({ eyebrow, title, description, icon }) {
  return (
    <div style={styles.sectionHeader}>
      <div>
        <p style={styles.eyebrow}>{eyebrow}</p>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <p style={styles.sectionDescription}>{description}</p>
      </div>

      <div style={styles.largeIcon}>{icon}</div>
    </div>
  );
}

// REUSABLE STATISTICS CARD
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

      {subtitle && (
        <p style={styles.statSubtitle}>{subtitle}</p>
      )}
    </div>
  );
}

// DASHBOARD STYLES
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

  filterRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },

  filterSelect: {
    padding: 13,
    marginBottom: 17,
    background: "#0b1120",
    color: "#f1f0fa",
    border: "1px solid #34334f",
    borderRadius: 8,
    minWidth: 180,
  },

  select: {
    width: "100%",
    padding: 11,
    marginTop: 7,
    marginBottom: 13,
    background: "#0b1120",
    color: "#f1f0fa",
    border: "1px solid #34334f",
    borderRadius: 7,
    boxSizing: "border-box",
  },

  fieldLabel: {
    display: "block",
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 10,
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

  documentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 17,
  },

  documentCard: {
    background: "#151b30",
    border: "1px solid #34304e",
    borderRadius: 12,
    padding: 19,
    minWidth: 0,
  },

  documentTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  documentIcon: {
    fontSize: 26,
  },

  categoryBadge: {
    background: "#30264d",
    color: "#d0bcff",
    padding: "6px 10px",
    borderRadius: 20,
    fontSize: 11,
  },

  documentTitle: {
    color: "#f1edff",
    fontSize: 17,
    margin: "10px 0",
    overflowWrap: "anywhere",
  },

  documentInfo: {
    color: "#aaa5c1",
    fontSize: 12,
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },

  permissionList: {
    background: "#0b1120",
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
  },

  permissionHeading: {
    color: "#c4b5fd",
    fontSize: 12,
  },

  permissionRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
    paddingTop: 10,
    color: "#c2bfd2",
    fontSize: 12,
  },

  permissionBadge: {
    background: "#123b32",
    color: "#6ee7b7",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 10,
  },

  accessControls: {
    marginTop: 16,
    borderTop: "1px solid #34304e",
    paddingTop: 12,
  },

  accessButton: {
    width: "100%",
    padding: 11,
    background: "linear-gradient(110deg, #7044c5, #9859db)",
    color: "white",
    border: 0,
    borderRadius: 7,
    cursor: "pointer",
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

  timeNote: {
    color: "#827d99",
    fontSize: 11,
    marginTop: 16,
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
