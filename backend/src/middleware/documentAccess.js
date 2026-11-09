const mongoose = require("mongoose");

const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");

const canAccessDocument = (requiredAccess = "READ") => {
  return async (req, res, next) => {
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

      const userId = req.user.id;

      // Only the document owner automatically has full access.
      const isOwner =
        document.owner.toString() === userId;

      // Check whether this user has explicit permission.
      const permission = (document.permissions || []).find(
        (item) => item.user.toString() === userId
      );

      const hasReadAccess = isOwner || !!permission;

      const hasEditAccess =
        isOwner ||
        (permission && permission.access === "EDIT");

      const allowed =
        requiredAccess === "EDIT"
          ? hasEditAccess
          : hasReadAccess;

      if (!allowed) {
        await AuditLog.create({
          user: userId,
          document: document._id,
          action: "ACCESS_DENIED",
          details: `User attempted ${requiredAccess} access`,
        });

        return res.status(403).json({
          message: "You do not have permission to access this document",
        });
      }

      req.document = document;

      next();
    } catch (error) {
      console.error("Document access error:", error.message);

      return res.status(500).json({
        message: "Could not verify document access",
      });
    }
  };
};

module.exports = canAccessDocument;