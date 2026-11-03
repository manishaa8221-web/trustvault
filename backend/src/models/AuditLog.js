const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    action: {
      type: String,
      required: true,
    },

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
    },

    details: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AuditLog",
  auditLogSchema
);