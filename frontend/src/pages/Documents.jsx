
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../api";

function Documents() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("General");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [shareInputs, setShareInputs] = useState({});
  const [currentUserId, setCurrentUserId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editValues, setEditValues] = useState({
    title: "",
    category: "General",
  });

  const API = `${API_BASE_URL}/documents`;
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");
  const isAdmin = role === "ADMIN";

  const headers = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUserId(data.user?.id || data.user?._id || "");
      }
    } catch (error) {
      console.error("Profile loading error:", error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load documents");
      }

      setDocuments(Array.isArray(data) ? data : data.documents || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    fetchProfile();
    fetchDocuments();
  }, []);

  const isOwner = (doc) => {
    const ownerId =
      typeof doc.owner === "object" ? doc.owner?._id : doc.owner;

    return ownerId?.toString() === currentUserId?.toString();
  };

  const canEdit = (doc) => {
    if (isOwner(doc)) return true;

    return doc.permissions?.some((permission) => {
      const sharedUser =
        typeof permission.user === "object"
          ? permission.user?._id
          : permission.user;

      return (
        sharedUser?.toString() === currentUserId?.toString() &&
        permission.access === "EDIT"
      );
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setMessage("Document uploaded successfully!");
      setFile(null);
      e.target.reset();

      await fetchDocuments();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await fetch(`${API}/${doc._id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = doc.originalName || doc.title || "document";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const startEdit = (doc) => {
    setEditingId(doc._id);
    setEditValues({
      title: doc.title || "",
      category: doc.category || "General",
    });
    setMessage("");
  };

  const handleEdit = async (documentId) => {
    if (!editValues.title.trim()) {
      setMessage("Document title is required.");
      return;
    }

    try {
      const response = await fetch(`${API}/${documentId}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({
          title: editValues.title.trim(),
          category: editValues.category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update document");
      }

      setEditingId(null);
      await fetchDocuments();
      setMessage("Document updated successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDelete = async (doc) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${doc.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API}/${doc._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete document");
      }

      await fetchDocuments();
      setMessage(data.message || "Document deleted successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateShareInput = (documentId, field, value) => {
    setShareInputs((previous) => ({
      ...previous,
      [documentId]: {
        ...previous[documentId],
        [field]: value,
      },
    }));
  };

  const handleShare = async (documentId) => {
    const input = shareInputs[documentId] || {};
    const userId = input.userId?.trim();
    const access = input.access || "READ";

    if (!userId) {
      setMessage("Please enter the registered user's ID.");
      return;
    }

    try {
      const response = await fetch(`${API}/${documentId}/share`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ userId, access }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to share document");
      }

      setShareInputs((previous) => ({
        ...previous,
        [documentId]: { userId: "", access: "READ" },
      }));

      await fetchDocuments();
      setMessage(data.message || "Document shared successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleRevoke = async (documentId) => {
    const userId = shareInputs[documentId]?.userId?.trim();

    if (!userId) {
      setMessage("Enter the user ID whose access you want to revoke.");
      return;
    }

    if (!window.confirm("Are you sure you want to revoke access?")) return;

    try {
      const response = await fetch(`${API}/${documentId}/share`, {
        method: "DELETE",
        headers: headers(),
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to revoke access");
      }

      await fetchDocuments();
      setMessage(data.message || "Access revoked successfully!");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const getFileIcon = (doc) => {
    const name = (doc.originalName || doc.title || "").toLowerCase();

    if (name.endsWith(".pdf")) return "📕";
    if (name.endsWith(".docx") || name.endsWith(".doc")) return "📘";
    if (name.endsWith(".txt")) return "📄";

    return "📁";
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

    return parsedDate.toLocaleDateString();
  };

  // Search and category filtering
  const filteredDocuments = documents.filter((doc) => {
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !search ||
      (doc.title || "").toLowerCase().includes(search) ||
      (doc.originalName || "").toLowerCase().includes(search);

    const matchesCategory =
      categoryFilter === "All" ||
      (doc.category || "General") === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const ownedDocuments = filteredDocuments.filter(isOwner);
  const sharedDocuments = filteredDocuments.filter((doc) => !isOwner(doc));

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("All");
  };

  const renderDocumentCard = (doc) => (
    <article key={doc._id} style={styles.documentCard}>
      {editingId === doc._id ? (
        <div style={styles.editPanel}>
          <h3 style={styles.cardHeading}>Edit document</h3>

          <label style={styles.label}>Document title</label>
          <input
            style={styles.input}
            value={editValues.title}
            onChange={(e) =>
              setEditValues((previous) => ({
                ...previous,
                title: e.target.value,
              }))
            }
          />

          <label style={styles.label}>Category</label>
          <select
            style={styles.input}
            value={editValues.category}
            onChange={(e) =>
              setEditValues((previous) => ({
                ...previous,
                category: e.target.value,
              }))
            }
          >
            <option value="General">General</option>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
            <option value="Important">Important</option>
          </select>

          <div style={styles.actionRow}>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => handleEdit(doc._id)}
            >
              Save changes
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setEditingId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={styles.cardTop}>
            <div style={styles.fileIcon}>{getFileIcon(doc)}</div>

            <div style={styles.fileInfo}>
              <h3 style={styles.cardHeading}>
                {doc.title || doc.originalName || "Untitled document"}
              </h3>

              <p style={styles.fileName}>
                {doc.originalName || "Uploaded document"}
              </p>
            </div>

            <span style={styles.categoryBadge}>
              {doc.category || "General"}
            </span>
          </div>

          <div style={styles.cardMeta}>
            <span>
              {isOwner(doc) ? "You own this document" : "Shared with you"}
            </span>
            <span>{formatDate(doc.createdAt)}</span>
          </div>

          <div style={styles.actionRow}>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => handleDownload(doc)}
            >
              ↓ Download
            </button>

            {canEdit(doc) && (
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => startEdit(doc)}
              >
                Edit
              </button>
            )}

            {isOwner(doc) && (
              <button
                type="button"
                style={styles.deleteButton}
                onClick={() => handleDelete(doc)}
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}

      {isOwner(doc) && (
        <details style={styles.details}>
          <summary style={styles.summary}>
            Manage sharing and permissions
          </summary>

          <div style={styles.sharePanel}>
            <label style={styles.label}>
              Recipient's registered user ID
            </label>

            <input
              type="text"
              placeholder="Enter user ID"
              value={shareInputs[doc._id]?.userId || ""}
              onChange={(e) =>
                updateShareInput(doc._id, "userId", e.target.value)
              }
              style={styles.input}
            />

            <label style={styles.label}>Permission</label>

            <select
              style={styles.input}
              value={shareInputs[doc._id]?.access || "READ"}
              onChange={(e) =>
                updateShareInput(doc._id, "access", e.target.value)
              }
            >
              <option value="READ">READ - Can view and download</option>
              <option value="EDIT">EDIT - Can edit document details</option>
            </select>

            <div style={styles.actionRow}>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={() => handleShare(doc._id)}
              >
                Share document
              </button>

              <button
                type="button"
                style={styles.deleteButton}
                onClick={() => handleRevoke(doc._id)}
              >
                Revoke access
              </button>
            </div>

            <div style={styles.sharedUsers}>
              <h4 style={styles.smallHeading}>People with access</h4>

              {doc.permissions?.length > 0 ? (
                doc.permissions.map((permission, index) => {
                  const sharedUser = permission.user;
                  const userId =
                    typeof sharedUser === "object"
                      ? sharedUser?._id
                      : sharedUser;

                  return (
                    <div key={userId || index} style={styles.permissionRow}>
                      <span>
                        {typeof sharedUser === "object"
                          ? sharedUser?.email || userId
                          : userId}
                      </span>

                      <span style={styles.permissionBadge}>
                        {permission.access}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p style={styles.mutedText}>No one has access yet.</p>
              )}
            </div>
          </div>
        </details>
      )}

      {!isOwner(doc) && doc.permissions?.length > 0 && (
        <div style={styles.sharedTag}>Shared document</div>
      )}
    </article>
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.brand}>TRUSTVAULT</div>
            <h1 style={styles.pageTitle}>Documents</h1>
            <p style={styles.subtitle}>
              Your secure space for managing and sharing files.
            </p>
          </div>

          <button
            type="button"
            style={styles.backButton}
            onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}
          >
            ← Back to dashboard
          </button>
        </header>

        <section style={styles.uploadCard}>
          <div style={styles.uploadHeading}>
            <div>
              <h2 style={styles.sectionTitle}>Upload a document</h2>
              <p style={styles.sectionSubtitle}>
                Securely add a file to your vault.
              </p>
            </div>

            <div style={styles.uploadIcon}>↑</div>
          </div>

          <form onSubmit={handleUpload}>
            <label style={styles.filePicker}>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                style={styles.hiddenFileInput}
                onChange={(e) => setFile(e.target.files[0] || null)}
              />

              <span style={styles.filePickerIcon}>＋</span>
              <span style={styles.filePickerTitle}>
                {file ? file.name : "Choose a file"}
              </span>
              <span style={styles.filePickerHint}>PDF, DOCX or TXT</span>
            </label>

            <div style={styles.uploadControls}>
              <div style={styles.categoryField}>
                <label style={styles.label}>Category</label>

                <select
                  style={styles.input}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                  <option value="Important">Important</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  ...styles.uploadButton,
                  opacity: loading ? 0.65 : 1,
                }}
                disabled={loading}
              >
                {loading ? "Uploading..." : "↑ Upload document"}
              </button>
            </div>
          </form>
        </section>

        {message && (
          <div style={styles.message} role="status">
            {message}
            <button
              type="button"
              style={styles.closeMessage}
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section style={styles.documentsSection}>
          <div style={styles.listHeading}>
            <div>
              <h2 style={styles.sectionTitle}>
                {isAdmin ? "My uploaded documents" : "Your documents"}
              </h2>
              <p style={styles.sectionSubtitle}>
                Showing {filteredDocuments.length} of {documents.length}{" "}
                {documents.length === 1 ? "document" : "documents"}
              </p>
            </div>
          </div>

          {/* Search and category filters */}
          <div style={styles.filterPanel}>
            <div style={styles.searchField}>
              <label style={styles.label}>Search documents</label>
              <div style={styles.searchWrapper}>
                <span style={styles.searchIcon}>⌕</span>
                <input
                  type="search"
                  placeholder="Search by title or filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            <div style={styles.filterField}>
              <label style={styles.label}>Filter by category</label>
              <select
                style={styles.input}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="All">All categories</option>
                <option value="General">General</option>
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Important">Important</option>
              </select>
            </div>

            <button
              type="button"
              style={styles.clearButton}
              onClick={clearFilters}
              disabled={!searchTerm && categoryFilter === "All"}
            >
              Clear filters
            </button>
          </div>

          {documents.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📂</div>
              <h3>No documents yet</h3>
              <p>Upload your first document to get started.</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🔎</div>
              <h3>No matching documents</h3>
              <p>Try another search term or category.</p>
              <button
                type="button"
                style={styles.primaryButton}
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {ownedDocuments.length > 0 && (
                <div style={styles.documentGroup}>
                  <h3 style={styles.groupTitle}>My uploads</h3>
                  <div style={styles.documentGrid}>
                    {ownedDocuments.map(renderDocumentCard)}
                  </div>
                </div>
              )}

              {!isAdmin && sharedDocuments.length > 0 && (
                <div style={styles.documentGroup}>
                  <h3 style={styles.groupTitle}>Shared with me</h3>
                  <div style={styles.documentGrid}>
                    {sharedDocuments.map(renderDocumentCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: `
      radial-gradient(ellipse at 8% 5%, rgba(124, 58, 237, 0.22), transparent 32%),
      radial-gradient(ellipse at 92% 85%, rgba(37, 99, 235, 0.16), transparent 35%),
      linear-gradient(135deg, #080b18 0%, #101326 48%, #0b1020 100%)
    `,
    backgroundAttachment: "fixed",
    padding: "36px 20px",
    color: "#f1efff",
    fontFamily: "Inter, Arial, sans-serif",
  },

  container: {
    maxWidth: "1120px",
    margin: "0 auto",
    width: "100%",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "30px",
  },

  brand: {
    color: "#b69aff",
    fontWeight: "800",
    letterSpacing: "2.5px",
    fontSize: "12px",
    marginBottom: "9px",
  },

  pageTitle: {
    fontSize: "34px",
    fontWeight: "750",
    margin: "0 0 7px",
    color: "#ffffff",
    letterSpacing: "-0.8px",
  },

  subtitle: {
    color: "#a4a5bd",
    margin: 0,
    fontSize: "14px",
  },

  backButton: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(196,181,253,0.25)",
    color: "#e5ddff",
    borderRadius: "10px",
    padding: "11px 16px",
    fontWeight: "600",
    cursor: "pointer",
  },

  uploadCard: {
    background: "rgba(22, 25, 48, 0.88)",
    padding: "27px",
    borderRadius: "19px",
    border: "1px solid rgba(167, 139, 250, 0.20)",
    boxShadow: "0 15px 45px rgba(0, 0, 0, 0.22)",
    marginBottom: "28px",
    backdropFilter: "blur(12px)",
  },

  uploadHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },

  sectionTitle: {
    color: "#f5f3ff",
    fontSize: "20px",
    fontWeight: "700",
    margin: "0 0 6px",
  },

  sectionSubtitle: {
    color: "#999bb7",
    fontSize: "13px",
    margin: 0,
  },

  uploadIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #7c3aed, #5b5bd6)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontSize: "27px",
    fontWeight: "700",
  },

  filePicker: {
    minHeight: "130px",
    border: "1.5px dashed rgba(167, 139, 250, 0.55)",
    background: "rgba(124, 58, 237, 0.07)",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    cursor: "pointer",
    padding: "15px",
    textAlign: "center",
  },

  hiddenFileInput: {
    display: "none",
  },

  filePickerIcon: {
    fontSize: "27px",
    color: "#b69aff",
  },

  filePickerTitle: {
    fontWeight: "650",
    fontSize: "14px",
    color: "#e7ddff",
    overflowWrap: "anywhere",
  },

  filePickerHint: {
    color: "#9294b2",
    fontSize: "12px",
  },

  uploadControls: {
    display: "flex",
    alignItems: "end",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "19px",
  },

  categoryField: {
    flex: "1",
    minWidth: "180px",
  },

  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "650",
    color: "#c3bddb",
    marginBottom: "7px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #393752",
    background: "#171a30",
    borderRadius: "9px",
    padding: "11px 12px",
    color: "#f3f0ff",
    outline: "none",
    fontSize: "13px",
    marginBottom: "13px",
    colorScheme: "dark",
  },

  uploadButton: {
    border: "none",
    borderRadius: "9px",
    background: "linear-gradient(135deg, #8b5cf6, #6845d9)",
    color: "#ffffff",
    padding: "12px 20px",
    minHeight: "41px",
    fontSize: "13px",
    fontWeight: "650",
    cursor: "pointer",
  },

  message: {
    background: "rgba(124, 58, 237, 0.13)",
    color: "#d9c9ff",
    border: "1px solid rgba(167, 139, 250, 0.35)",
    borderRadius: "10px",
    padding: "13px 16px",
    marginBottom: "22px",
    fontSize: "13px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  closeMessage: {
    border: "none",
    background: "transparent",
    color: "#d9c9ff",
    fontSize: "21px",
    cursor: "pointer",
  },

  documentsSection: {
    marginTop: "28px",
  },

  listHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },

  filterPanel: {
    display: "flex",
    alignItems: "end",
    gap: "15px",
    flexWrap: "wrap",
    padding: "18px",
    background: "rgba(22, 25, 48, 0.88)",
    border: "1px solid rgba(167, 139, 250, 0.20)",
    borderRadius: "14px",
    marginBottom: "23px",
  },

  searchField: {
    flex: "2",
    minWidth: "220px",
  },

  filterField: {
    flex: "1",
    minWidth: "170px",
  },

  searchWrapper: {
    position: "relative",
  },

  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "7px",
    color: "#b69aff",
    fontSize: "22px",
    pointerEvents: "none",
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #393752",
    background: "#171a30",
    borderRadius: "9px",
    padding: "11px 12px 11px 38px",
    color: "#f3f0ff",
    outline: "none",
    fontSize: "13px",
    colorScheme: "dark",
  },

  clearButton: {
    border: "1px solid rgba(167, 139, 250, 0.28)",
    borderRadius: "9px",
    background: "rgba(139, 92, 246, 0.08)",
    color: "#d4c4ff",
    padding: "11px 14px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    minHeight: "40px",
  },

  documentGroup: {
    marginBottom: "28px",
  },

  groupTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#c4a9ff",
    marginBottom: "13px",
  },

  documentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "17px",
  },

  documentCard: {
    background: "linear-gradient(145deg, rgba(27, 30, 55, 0.96), rgba(20, 23, 44, 0.96))",
    border: "1px solid rgba(167, 139, 250, 0.17)",
    borderRadius: "16px",
    padding: "19px",
    boxShadow: "0 9px 26px rgba(0, 0, 0, 0.20)",
    minWidth: 0,
    backdropFilter: "blur(10px)",
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  fileIcon: {
    width: "44px",
    height: "44px",
    flexShrink: 0,
    borderRadius: "12px",
    background: "rgba(139, 92, 246, 0.17)",
    display: "grid",
    placeItems: "center",
    fontSize: "21px",
  },

  fileInfo: {
    flex: 1,
    minWidth: 0,
  },

  cardHeading: {
    color: "#f5f3ff",
    fontSize: "14px",
    fontWeight: "700",
    margin: "0 0 5px",
    overflowWrap: "anywhere",
  },

  fileName: {
    color: "#999bb7",
    fontSize: "11px",
    margin: 0,
    overflowWrap: "anywhere",
  },

  categoryBadge: {
    background: "rgba(139, 92, 246, 0.18)",
    color: "#d1bdff",
    padding: "6px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: "700",
    flexShrink: 0,
  },

  cardMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    color: "#999bb7",
    fontSize: "11px",
    paddingTop: "13px",
    marginTop: "16px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },

  actionRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "16px",
  },

  primaryButton: {
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #8b5cf6, #6845d9)",
    color: "#ffffff",
    padding: "9px 13px",
    fontSize: "12px",
    fontWeight: "650",
    cursor: "pointer",
  },

  secondaryButton: {
    border: "1px solid rgba(167, 139, 250, 0.28)",
    borderRadius: "8px",
    background: "rgba(139, 92, 246, 0.08)",
    color: "#d4c4ff",
    padding: "9px 13px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },

  deleteButton: {
    border: "1px solid rgba(248, 113, 113, 0.28)",
    borderRadius: "8px",
    background: "rgba(239, 68, 68, 0.09)",
    color: "#ffaaaa",
    padding: "9px 13px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },

  details: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    marginTop: "17px",
    paddingTop: "13px",
  },

  summary: {
    color: "#c4a9ff",
    fontSize: "12px",
    fontWeight: "650",
    cursor: "pointer",
  },

  sharePanel: {
    background: "rgba(10, 13, 29, 0.65)",
    border: "1px solid rgba(167, 139, 250, 0.12)",
    borderRadius: "10px",
    padding: "14px",
    marginTop: "13px",
  },

  sharedUsers: {
    borderTop: "1px solid rgba(255,255,255,0.09)",
    marginTop: "14px",
    paddingTop: "12px",
  },

  smallHeading: {
    fontSize: "12px",
    color: "#d4c4ff",
    margin: "0 0 10px",
  },

  permissionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    fontSize: "11px",
    color: "#c2c2d8",
    overflowWrap: "anywhere",
  },

  permissionBadge: {
    color: "#d8c7ff",
    background: "rgba(139, 92, 246, 0.19)",
    padding: "4px 7px",
    borderRadius: "6px",
    fontWeight: "700",
    flexShrink: 0,
  },

  mutedText: {
    color: "#9294ae",
    fontSize: "11px",
  },

  editPanel: {
    display: "flex",
    flexDirection: "column",
  },

  emptyState: {
    textAlign: "center",
    background: "rgba(22, 25, 48, 0.88)",
    border: "1px solid rgba(167, 139, 250, 0.18)",
    borderRadius: "16px",
    padding: "48px 20px",
    color: "#a5a5c0",
    boxShadow: "0 9px 26px rgba(0, 0, 0, 0.18)",
  },

  emptyIcon: {
    fontSize: "37px",
    marginBottom: "12px",
  },

  sharedTag: {
    display: "inline-block",
    marginTop: "13px",
    padding: "6px 9px",
    background: "rgba(59, 130, 246, 0.13)",
    color: "#a8ceff",
    borderRadius: "7px",
    fontSize: "11px",
    fontWeight: "650",
  },
};

export default Documents;
