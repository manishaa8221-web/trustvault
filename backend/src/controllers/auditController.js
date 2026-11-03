const AuditLog = require("../models/AuditLog");

const getLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("user")
      .populate("document");

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getLogs,
};