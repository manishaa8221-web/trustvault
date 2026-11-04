const User = require("../models/User");
const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");

const getDashboardStats = async (req, res) => {
  try {
    const users = await User.countDocuments();

    const documents =
      await Document.countDocuments();

    const logs =
      await AuditLog.countDocuments();

    res.status(200).json({
      totalUsers: users,
      totalDocuments: documents,
      totalLogs: logs,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};