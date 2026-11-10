
const mongoose = require("mongoose");

const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");

// GET AUDIT LOGS FOR ONE DOCUMENT
// Accessible by the document owner or an ADMIN.
const getDocumentAuditLogs = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const isOwner = document.owner.toString() === req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Only the document owner or an admin can view audit logs",
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({ document: document._id })
        .populate("user", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      AuditLog.countDocuments({
        document: document._id,
      }),
    ]);

    return res.status(200).json({
      message: "Document audit logs retrieved successfully",
      documentId: document._id,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      logs,
    });
  } catch (error) {
    console.error("Get document audit logs error:", error);

    return res.status(500).json({
      message: "Could not retrieve document audit logs",
    });
  }
};

// GET ALL AUDIT LOGS - ADMIN ONLY
const getAllAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );

    const skip = (page - 1) * limit;

    // Optional filters
    const filter = {};

    if (req.query.action && typeof req.query.action === "string") {
      filter.action = req.query.action.trim();
    }

    if (
      req.query.userId &&
      mongoose.Types.ObjectId.isValid(req.query.userId)
    ) {
      filter.user = req.query.userId;
    }

    if (
      req.query.documentId &&
      mongoose.Types.ObjectId.isValid(req.query.documentId)
    ) {
      filter.document = req.query.documentId;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("user", "name email role")
        .populate("document", "title owner")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "System audit logs retrieved successfully",
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      logs,
    });
  } catch (error) {
    console.error("Get all audit logs error:", error);

    return res.status(500).json({
      message: "Could not retrieve system audit logs",
    });
  }
};

module.exports = {
  getDocumentAuditLogs,
  getAllAuditLogs,
};
