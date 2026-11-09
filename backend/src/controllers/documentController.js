const mongoose = require("mongoose");

const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");

// Record document activity
const writeAuditLog = async (user, document, action, details) => {
  await AuditLog.create({
    user,
    document: document || undefined,
    action,
    details,
  });
};

// Escape special characters before using search text in a regular expression
const escapeRegExp = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Create a new text-based document
const createDocument = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof content !== "string"
    ) {
      return res.status(400).json({
        message: "A valid title and content are required",
      });
    }

    const document = await Document.create({
      title: title.trim(),
      content,
      category:
        typeof category === "string" && category.trim()
          ? category.trim()
          : "General",
      owner: req.user.id,
    });

    await writeAuditLog(
      req.user.id,
      document._id,
      "CREATE_DOCUMENT",
      "Document created"
    );

    return res.status(201).json({
      message: "Document created successfully",
      document,
    });
  } catch (error) {
    console.error("Create document error:", error.message);

    return res.status(500).json({
      message: "Could not create document",
    });
  }
};

// Get documents the logged-in user is allowed to access
const getDocuments = async (req, res) => {
  try {
    const { search, category, from, to } = req.query;

    const filters = [
      {
        $or: [
          { owner: req.user.id },
          { "permissions.user": req.user.id },
        ],
      },
    ];

    if (search && search.trim()) {
      filters.push({
        title: {
          $regex: escapeRegExp(search.trim()),
          $options: "i",
        },
      });
    }

    if (category && category.trim()) {
      filters.push({
        category: {
          $regex: `^${escapeRegExp(category.trim())}$`,
          $options: "i",
        },
      });
    }

    if (from || to) {
      const dateFilter = {};

      if (from) {
        const fromDate = new Date(from);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid from date",
          });
        }

        dateFilter.$gte = fromDate;
      }

      if (to) {
        const toDate = new Date(to);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            message: "Invalid to date",
          });
        }

        toDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = toDate;
      }

      filters.push({ createdAt: dateFilter });
    }

    const documents = await Document.find({
      $and: filters,
    })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get documents error:", error.message);

    return res.status(500).json({
      message: "Could not retrieve documents",
    });
  }
};

// Update a document. EDIT permission is checked by route middleware.
const updateDocument = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const document = req.document;

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const hasUpdate =
      title !== undefined ||
      content !== undefined ||
      category !== undefined;

    if (!hasUpdate) {
      return res.status(400).json({
        message: "Provide at least one field to update",
      });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          message: "Title must be a non-empty string",
        });
      }

      document.title = title.trim();
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({
          message: "Category must be a non-empty string",
        });
      }

      document.category = category.trim();
    }

    if (content !== undefined) {
      // Uploaded files need a separate secure file-replacement feature.
      if (document.storageName) {
        return res.status(400).json({
          message:
            "Uploaded file contents cannot be edited through this endpoint. Use a file replacement feature.",
        });
      }

      if (typeof content !== "string") {
        return res.status(400).json({
          message: "Content must be a string",
        });
      }

      document.content = content;
    }

    await document.save();

    await writeAuditLog(
      req.user.id,
      document._id,
      "UPDATE_DOCUMENT",
      "Document details updated"
    );

    return res.status(200).json({
      message: "Document updated successfully",
      document,
    });
  } catch (error) {
    console.error("Update document error:", error.message);

    return res.status(500).json({
      message: "Could not update document",
    });
  }
};

// Grant READ or EDIT access to another registered user
const grantAccess = async (req, res) => {
  try {
    const { userId, access } = req.body;
    const documentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "A valid userId is required",
      });
    }

    if (!["READ", "EDIT"].includes(access)) {
      return res.status(400).json({
        message: "Access must be READ or EDIT",
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      await writeAuditLog(
        req.user.id,
        null,
        "ACCESS_GRANT_DENIED",
        `Attempted to share nonexistent document ${documentId}`
      );

      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (document.owner.toString() !== req.user.id) {
      await writeAuditLog(
        req.user.id,
        document._id,
        "ACCESS_GRANT_DENIED",
        "Non-owner attempted to grant document access"
      );

      return res.status(403).json({
        message: "Only the document owner can grant access",
      });
    }

    if (document.owner.toString() === userId) {
      return res.status(400).json({
        message: "The owner already has full access",
      });
    }

    const recipient = await User.findById(userId);

    if (!recipient) {
      return res.status(404).json({
        message: "Recipient user not found",
      });
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

    await writeAuditLog(
      req.user.id,
      document._id,
      "ACCESS_GRANTED",
      `Granted ${access} access to user ${userId}`
    );

    return res.status(200).json({
      message: "Access granted successfully",
      document,
    });
  } catch (error) {
    console.error("Grant access error:", error.message);

    return res.status(500).json({
      message: "Could not grant access",
    });
  }
};

// Revoke a user's document access
const revokeAccess = async (req, res) => {
  try {
    const { userId } = req.body;
    const documentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "A valid userId is required",
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      await writeAuditLog(
        req.user.id,
        null,
        "ACCESS_REVOKE_DENIED",
        `Attempted to revoke access to nonexistent document ${documentId}`
      );

      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (document.owner.toString() !== req.user.id) {
      await writeAuditLog(
        req.user.id,
        document._id,
        "ACCESS_REVOKE_DENIED",
        "Non-owner attempted to revoke document access"
      );

      return res.status(403).json({
        message: "Only the document owner can revoke access",
      });
    }

    const permissionExists = document.permissions.some(
      (permission) => permission.user.toString() === userId
    );

    if (!permissionExists) {
      return res.status(404).json({
        message: "This user does not have access to the document",
      });
    }

    document.permissions = document.permissions.filter(
      (permission) => permission.user.toString() !== userId
    );

    await document.save();

    await writeAuditLog(
      req.user.id,
      document._id,
      "ACCESS_REVOKED",
      `Revoked access for user ${userId}`
    );

    return res.status(200).json({
      message: "Access revoked successfully",
      document,
    });
  } catch (error) {
    console.error("Revoke access error:", error.message);

    return res.status(500).json({
      message: "Could not revoke access",
    });
  }
};

module.exports = {
  createDocument,
  getDocuments,
  updateDocument,
  grantAccess,
  revokeAccess,
};