
const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const router = express.Router();

const {
  createDocument,
  getDocuments,
  updateDocument,
  grantAccess,
  revokeAccess,
} = require("../controllers/documentController");

const {
  getDocumentAuditLogs,
} = require("../controllers/auditLogController");

const {
  uploadDocument,
  downloadDocument,
} = require("../controllers/uploadController");

const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");

const protect = require("../middleware/authMiddleware");
const canAccessDocument = require("../middleware/documentAccess");
const uploadFile = require("../middleware/fileUpload");

// UPLOAD DOCUMENT
router.post("/upload", protect, uploadFile, uploadDocument);

// CREATE AND RETRIEVE DOCUMENTS
router.post("/", protect, createDocument);
router.get("/", protect, getDocuments);

// SHARE AND REVOKE DOCUMENT ACCESS
router.post("/:id/share", protect, grantAccess);
router.delete("/:id/share", protect, revokeAccess);

// VIEW AUDIT LOGS
router.get("/:id/audit-logs", protect, getDocumentAuditLogs);

// UPDATE DOCUMENT
router.put(
  "/:id",
  protect,
  canAccessDocument("EDIT"),
  updateDocument
);

// DELETE DOCUMENT - OWNER ONLY
router.delete("/:id", protect, async (req, res) => {
  try {
    const documentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (document.owner.toString() !== req.user.id) {
      await AuditLog.create({
        user: req.user.id,
        document: document._id,
        action: "DELETE_DENIED",
        details: "Unauthorized document deletion attempt",
      });

      return res.status(403).json({
        message: "Only the document owner can delete this document",
      });
    }

    const storageName = document.storageName;

    await AuditLog.create({
      user: req.user.id,
      document: document._id,
      action: "DOCUMENT_DELETED",
      details: `Document "${document.title}" was deleted`,
    });

    await document.deleteOne();

    if (storageName) {
      const uploadDirectory = path.resolve(
        __dirname,
        "../../uploads"
      );

      const filePath = path.resolve(
        uploadDirectory,
        storageName
      );

      if (
        path.dirname(filePath) === uploadDirectory &&
        path.basename(storageName) === storageName
      ) {
        try {
          await fs.promises.unlink(filePath);
        } catch (fileError) {
          if (fileError.code !== "ENOENT") {
            console.error("PDF cleanup error:", fileError);
          }
        }
      }
    }

    return res.status(200).json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Document deletion error:", error);

    return res.status(500).json({
      message: "Unable to delete document",
    });
  }
});

// DOWNLOAD DOCUMENT - READ ACCESS REQUIRED
router.get(
  "/:id/download",
  protect,
  canAccessDocument("READ"),
  downloadDocument
);

// VIEW DOCUMENT - READ ACCESS REQUIRED
router.get(
  "/:id",
  protect,
  canAccessDocument("READ"),
  async (req, res) => {
    try {
      const document = req.document;

      // Record who viewed the document and when.
      await AuditLog.create({
        user: req.user.id,
        document: document._id,
        action: "DOCUMENT_VIEWED",
        details: `Viewed document "${document.title}"`,
      });

      return res.status(200).json(document);
    } catch (error) {
      console.error("Document view audit error:", error.message);

      return res.status(500).json({
        message: "Could not retrieve document",
      });
    }
  }
);

module.exports = router;
