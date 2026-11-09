const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Existing text-based documents remain supported.
    content: {
      type: String,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    permissions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        access: {
          type: String,
          enum: ["READ", "EDIT"],
          default: "READ",
        },
      },
    ],

    category: {
      type: String,
      default: "General",
    },

    // Uploaded file information
    originalName: {
      type: String,
    },

    storageName: {
      type: String,
      unique: true,
      sparse: true,
    },

    mimeType: {
      type: String,
    },

    fileSize: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);