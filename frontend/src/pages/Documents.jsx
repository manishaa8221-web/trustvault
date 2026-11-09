
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
  const [editValues, setEditValues] = useState({
    title: "",
    category: "General",
  });

  const API = "http://localhost:5000/api/documents";
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");
  const isAdmin = role === "ADMIN";

  const headers = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/user/profile",
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
      setMessage("");

      const response = await fetch(API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load documents");
      }

      setDocuments(
        Array.isArray(data) ? data : data.documents || []
      );
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
      setMessage("Please select a file.");
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
      setMessage("");

      const response = await fetch(
        `${API}/${doc._id}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

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

      setMessage("Document updated successfully!");
      setEditingId(null);
      await fetchDocuments();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDelete = async (doc) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${doc.title}"? This cannot be undone.`
      )
    ) return;

    try {
      const response = await fetch(`${API}/${doc._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete document");
      }

      setMessage(data.message || "Document deleted successfully!");
      await fetchDocuments();
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

      setMessage(data.message || "Document shared successfully!");

      setShareInputs((previous) => ({
        ...previous,
        [documentId]: { userId: "", access: "READ" },
      }));

      await fetchDocuments();
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

      setMessage(data.message || "Access revoked successfully!");
      await fetchDocuments();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div style={styles.page}>
      <h1>TrustVault Documents</h1>

      <p style={styles.subtitle}>
        {isAdmin
          ? "Administrator document management — documents you own."
          : "Manage your documents and documents shared with you."}
      </p>

      <button
        style={styles.backButton}
        onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}
      >
        ← Back to {isAdmin ? "Admin Dashboard" : "User Dashboard"}
      </button>

      <section style={styles.section}>
        <h2>Upload Document</h2>

        <form onSubmit={handleUpload}>
          <p>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </p>

          <p>
            <label>Category: </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="General">General</option>
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Important">Important</option>
            </select>
          </p>

          <button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      </section>

      {message && <p style={styles.message}>{message}</p>}

      <section style={styles.section}>
        <h2>{isAdmin ? "My Uploaded Documents" : "My Documents and Shared Documents"}</h2>

        {documents.length === 0 ? (
          <p>No documents found.</p>
        ) : (
          documents.map((doc) => (
            <div key={doc._id} style={styles.documentCard}>
              {editingId === doc._id ? (
                <>
                  <h3>Edit Document</h3>
                  <p>
                    <input
                      value={editValues.title}
                      onChange={(e) =>
                        setEditValues((previous) => ({
                          ...previous,
                          title: e.target.value,
                        }))
                      }
                    />
                  </p>
                  <p>
                    <select
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
                  </p>
                  <button onClick={() => handleEdit(doc._id)}>Save Changes</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <h3>{doc.title}</h3>
                  <p>Category: {doc.category || "General"}</p>

                  <button onClick={() => handleDownload(doc)}>
                    Download
                  </button>

                  {canEdit(doc) && (
                    <button onClick={() => startEdit(doc)}>Edit</button>
                  )}

                  {isOwner(doc) && (
                    <button
                      onClick={() => handleDelete(doc)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  )}
                </>
              )}

              {isOwner(doc) && (
                <>
                  <hr />
                  <h3>Share Document</h3>

                  <input
                    type="text"
                    placeholder="Recipient's registered MongoDB user ID"
                    value={shareInputs[doc._id]?.userId || ""}
                    onChange={(e) =>
                      updateShareInput(doc._id, "userId", e.target.value)
                    }
                    style={styles.shareInput}
                  />

                  <select
                    value={shareInputs[doc._id]?.access || "READ"}
                    onChange={(e) =>
                      updateShareInput(doc._id, "access", e.target.value)
                    }
                  >
                    <option value="READ">READ</option>
                    <option value="EDIT">EDIT</option>
                  </select>

                  <button onClick={() => handleShare(doc._id)}>
                    Share Document
                  </button>

                  <button onClick={() => handleRevoke(doc._id)}>
                    Revoke Access
                  </button>
                </>
              )}

              <h4>Current Shared Users</h4>
              {doc.permissions?.length > 0 ? (
                <ul>
                  {doc.permissions.map((permission, index) => {
                    const sharedUser = permission.user;
                    const userId =
                      typeof sharedUser === "object"
                        ? sharedUser?._id
                        : sharedUser;

                    return (
                      <li key={userId || index}>
                        {typeof sharedUser === "object"
                          ? sharedUser?.email || userId
                          : userId}
                        {" — "}
                        {permission.access}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>No users have been given access yet.</p>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    maxWidth: "1000px",
    margin: "auto",
    fontFamily: "Arial, sans-serif",
    background: "#f4f6fb",
    minHeight: "100vh",
  },
  subtitle: { color: "#64748b" },
  section: {
    background: "white",
    padding: "22px",
    marginTop: "22px",
    borderRadius: "10px",
  },
  documentCard: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "18px",
    marginBottom: "20px",
    background: "white",
  },
  backButton: { padding: "10px 15px", cursor: "pointer" },
  deleteButton: { color: "red", marginLeft: "8px" },
  shareInput: { width: "320px", padding: "8px", marginRight: "8px" },
  message: {
    padding: "12px",
    background: "#ede9fe",
    color: "#5b21b6",
    borderRadius: "8px",
  },
};

export default Documents;
