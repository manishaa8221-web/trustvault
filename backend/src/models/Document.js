const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
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
          enum: ["READ", "WRITE"],
          default: "READ",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Document",
  documentSchema
);