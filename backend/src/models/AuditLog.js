
const mongoose = require("mongoose");
const crypto = require("crypto");

let auditQueue = Promise.resolve();

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      required: true,
      immutable: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      immutable: true,
    },
    details: {
      type: String,
      immutable: true,
    },
    previousHash: {
      type: String,
      immutable: true,
    },
    hash: {
      type: String,
      immutable: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

// Automatically hash every new audit record.
// This also covers existing controllers using AuditLog.create().
auditLogSchema.pre("save", async function () {
  if (!this.isNew) {
    throw new Error("Existing audit logs cannot be modified.");
  }

  const task = auditQueue.then(async () => {
    const secret = process.env.AUDIT_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error("AUDIT_SECRET must contain at least 32 characters.");
    }

    const previousLog = await this.constructor.findOne({
      hash: { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1, _id: -1 })
      .select("hash");

    this.previousHash = previousLog?.hash || "GENESIS";
    this.createdAt = this.createdAt || new Date();

    const auditData = {
      user: this.user ? this.user.toString() : null,
      document: this.document ? this.document.toString() : null,
      action: this.action,
      details: this.details || "",
      previousHash: this.previousHash,
      createdAt: this.createdAt,
    };

    this.hash = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(auditData))
      .digest("hex");
  });

  auditQueue = task.catch(() => {});
  await task;
});

// Prevent query-based updates and deletions.
const blockMutation = async function () {
  throw new Error(
    "Audit logs are immutable and cannot be modified or deleted."
  );
};

auditLogSchema.pre("updateOne", blockMutation);
auditLogSchema.pre("updateMany", blockMutation);
auditLogSchema.pre("findOneAndUpdate", blockMutation);
auditLogSchema.pre("replaceOne", blockMutation);
auditLogSchema.pre("deleteOne", blockMutation);
auditLogSchema.pre("deleteMany", blockMutation);
auditLogSchema.pre("findOneAndDelete", blockMutation);
auditLogSchema.pre("findOneAndReplace", blockMutation);

// Prevent document-level deletion.
auditLogSchema.pre(
  "deleteOne",
  { document: true, query: false },
  blockMutation
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
