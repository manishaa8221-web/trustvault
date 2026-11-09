const mongoose = require("mongoose");

const User = require("../models/User");
const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");

// ADMIN DASHBOARD STATISTICS
const getDashboardStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "ADMIN" });
    const totalDocuments = await Document.countDocuments();
    const totalLogs = await AuditLog.countDocuments();

    const activeUsersResult = await AuditLog.distinct("user", {
      action: "LOGIN",
      user: { $ne: null },
      createdAt: { $gte: thirtyDaysAgo },
    });

    const activeUsers = activeUsersResult.length;

    const recentLogs = await AuditLog.find()
      .populate("user", "name email")
      .populate("document", "title")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      statistics: {
        totalUsers,
        activeUsers,
        totalAdmins,
        totalDocuments,
        totalLogs,
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

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Validate account status
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    // Prevent administrator from changing their own status
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

    // Protect administrator accounts
    if (user.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be changed here",
      });
    }

    user.isActive = isActive;
    await user.save();

    // Record the status change
    await AuditLog.create({
      user: req.user.id,
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      details: `${user.email} account was ${
        isActive ? "activated" : "deactivated"
      }`,
    });

    return res.status(200).json({
      success: true,
      message: `User account ${isActive ? "activated" : "deactivated"} successfully`,
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

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
};