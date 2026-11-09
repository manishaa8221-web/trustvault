
const mongoose = require("mongoose");

const Document = require("../models/Document");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// GRANT DOCUMENT PERMISSION
const grantPermission = async (req, res) => {
  try {
    const { documentId, userId, access } = req.body;

    if (!documentId || !userId || !access) {
      return res.status(400).json({
        message: "documentId, userId and access are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(documentId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        message: "Invalid document ID or user ID",
      });
    }

    if (!["READ", "EDIT"].includes(access)) {
      return res.status(400).json({
        message: "Access must be READ or EDIT",
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    // Only the document owner can grant permissions.
    if (document.owner.toString() !== req.user.id) {
      await AuditLog.create({
        user: req.user.id,
        document: document._id,
        action: "ACCESS_GRANT_DENIED",
        details: "Non-owner attempted to grant document access",
      });

      return res.status(403).json({
        message: "Only the document owner can grant access",
      });
    }

    if (document.owner.toString() === userId) {
      return res.status(400).json({
        message: "The document owner already has full access",
      });
    }

    const recipient = await User.findById(userId);

    if (!recipient || recipient.isActive === false) {
      return res.status(404).json({
        message: "Active recipient user not found",
      });
    }

    if (!Array.isArray(document.permissions)) {
      document.permissions = [];
    }

    const existingPermission = document.permissions.find(
      (permission) => permission.user.toString() === userId
    );

    if (existingPermission) {
      existingPermission.access = access;
    } else {
      document.permissions.push({
        user: userId,
        access,
      });
    }

    await document.save();

    await AuditLog.create({
      user: req.user.id,
      document: document._id,
      action: "ACCESS_GRANTED",
      details: `${access} permission granted to ${recipient.email}`,
    });

    return res.status(200).json({
      message: "Permission granted successfully",
      documentId: document._id,
      userId,
      access,
    });
  } catch (error) {
    console.error("Grant permission error:", error.message);

    return res.status(500).json({
      message: "Unable to grant permission",
    });
  }
};

// REVOKE DOCUMENT PERMISSION
const revokePermission = async (req, res) => {
  try {
    const { documentId, userId } = req.body;

    if (!documentId || !userId) {
      return res.status(400).json({
        message: "documentId and userId are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(documentId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        message: "Invalid document ID or user ID",
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    // Only the document owner can revoke permissions.
    if (document.owner.toString() !== req.user.id) {
      await AuditLog.create({
        user: req.user.id,
        document: document._id,
        action: "ACCESS_REVOKE_DENIED",
        details: "Non-owner attempted to revoke document access",
      });

      return res.status(403).json({
        message: "Only the document owner can revoke access",
      });
    }

    if (!Array.isArray(document.permissions)) {
      document.permissions = [];
    }

    const permissionExists = document.permissions.some(
      (permission) => permission.user.toString() === userId
    );

    if (!permissionExists) {
      return res.status(404).json({
        message: "Permission not found",
      });
    }

    document.permissions = document.permissions.filter(
      (permission) => permission.user.toString() !== userId
    );

    await document.save();

    await AuditLog.create({
      user: req.user.id,
      document: document._id,
      action: "ACCESS_REVOKED",
      details: `Permission revoked from user ${userId}`,
    });

    return res.status(200).json({
      message: "Permission revoked successfully",
      documentId: document._id,
      userId,
    });
  } catch (error) {
    console.error("Revoke permission error:", error.message);

    return res.status(500).json({
      message: "Unable to revoke permission",
    });
  }
};

module.exports = {
  grantPermission,
  revokePermission,
};
