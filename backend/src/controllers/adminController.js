
const mongoose = require("mongoose");

const User = require("../models/User");
const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");

// ADMIN DASHBOARD STATISTICS
const getDashboardStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      totalAdmins,
      totalDocuments,
      totalLogs,
      totalSharedDocuments,
      totalRevokedPermissions,
      activeUsersResult,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "ADMIN" }),
      Document.countDocuments(),
      AuditLog.countDocuments(),
      Document.countDocuments({
        "permissions.0": { $exists: true },
      }),
      AuditLog.countDocuments({
        action: "ACCESS_REVOKED",
      }),
      AuditLog.distinct("user", {
        action: "LOGIN",
        user: { $ne: null },
        createdAt: { $gte: thirtyDaysAgo },
      }),
    ]);

    const recentLogs = await AuditLog.find()
      .populate("user", "name email")
      .populate("document", "title")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      statistics: {
        totalUsers,
        activeUsers: activeUsersResult.length,
        totalAdmins,
        totalDocuments,
        totalLogs,
        totalSharedDocuments,
        totalRevokedPermissions,
      },
      recentLogs,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard",
    });
  }
};

// GET ALL REGISTERED USERS
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role isActive createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalUsers: users.length,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve users",
    });
  }
};

// ACTIVATE OR DEACTIVATE A USER
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own account status",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be changed here",
      });
    }

    user.isActive = isActive;
    await user.save();

    await AuditLog.create({
      user: req.user.id,
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      details: `${user.email} account was ${
        isActive ? "activated" : "deactivated"
      }`,
    });

    return res.status(200).json({
      success: true,
      message: `User account ${
        isActive ? "activated" : "deactivated"
      } successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user account status",
    });
  }
};

// ADMIN: GET ALL DOCUMENTS
const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find()
      .populate("owner", "name email")
      .populate("permissions.user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalDocuments: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Admin get documents error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve documents",
    });
  }
};

// ADMIN: GRANT OR REVOKE DOCUMENT ACCESS
// access can be READ, EDIT, or NO ACCESS.
const updateDocumentAccess = async (req, res) => {
  try {
    const { id: documentId } = req.params;
    const { userId, access } = req.body;

    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "A valid userId is required",
      });
    }

    const allowedAccess = ["READ", "EDIT", "NO ACCESS"];

    if (!allowedAccess.includes(access)) {
      return res.status(400).json({
        success: false,
        message: "Access must be READ, EDIT, or NO ACCESS",
      });
    }

    const [document, recipient] = await Promise.all([
      Document.findById(documentId),
      User.findById(userId),
    ]);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Admins cannot assign document permissions to other admins.
    if (recipient.role === "ADMIN") {
      return res.status(400).json({
        success: false,
        message: "Document permissions cannot be assigned to administrators",
      });
    }

    // The document owner already has full access.
    if (document.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "The document owner already has full access",
      });
    }

    const existingPermission = document.permissions.find(
      (permission) =>
        permission.user &&
        permission.user.toString() === userId
    );

    if (access === "NO ACCESS") {
      if (existingPermission) {
        document.permissions = document.permissions.filter(
          (permission) =>
            permission.user &&
            permission.user.toString() !== userId
        );

        await document.save();

        await AuditLog.create({
          user: req.user.id,
          document: document._id,
          action: "ACCESS_REVOKED",
          details: `Administrator revoked document access for ${recipient.email}`,
        });
      }

      return res.status(200).json({
        success: true,
        message: existingPermission
          ? "Document access revoked successfully"
          : "User already has no access",
        access: "NO ACCESS",
      });
    }

    if (existingPermission) {
      existingPermission.access = access;
    } else {
      document.permissions.push({
        user: recipient._id,
        access,
      });
    }

    await document.save();

    await AuditLog.create({
      user: req.user.id,
      document: document._id,
      action: "ACCESS_GRANTED",
      details: `Administrator granted ${access} access to ${recipient.email}`,
    });

    return res.status(200).json({
      success: true,
      message: `${access} access granted successfully`,
      access,
      documentId: document._id,
      user: {
        id: recipient._id,
        name: recipient.name,
        email: recipient.email,
      },
    });
  } catch (error) {
    console.error("Admin document access error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update document permissions",
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllDocuments,
  updateDocumentAccess,
};
