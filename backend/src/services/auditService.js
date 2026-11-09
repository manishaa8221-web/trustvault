
const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
  user,
  document,
  action,
  details,
}) => {
  if (!action) {
    throw new Error("Audit action is required.");
  }

  return AuditLog.create({
    user: user || undefined,
    document: document || undefined,
    action,
    details: details || "",
  });
};

module.exports = {
  createAuditLog,
};
