
const mongoose = require("mongoose");

const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");

// GET AUDIT LOGS FOR A DOCUMENT (OWNER ONLY)
const getDocumentAuditLogs = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate document ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

    // 2. Find document
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    // 3. Check document ownership
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only the document owner can view audit logs",
      });
    }

    // 4. Pagination
    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        parseInt(req.query.limit, 10) || 20
      )
    );

    const skip = (page - 1) * limit;

    // 5. Retrieve audit logs
    const [logs, total] = await Promise.all([
      AuditLog.find({
        document: document._id,
      })
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      AuditLog.countDocuments({
        document: document._id,
      }),
    ]);

    // 6. Send response
    return res.status(200).json({
      message: "Audit logs retrieved successfully",

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
    console.error("Get audit logs error:", error);

    return res.status(500).json({
      message: "Could not retrieve audit logs",
    });
  }
};

module.exports = {
  getDocumentAuditLogs,
};
