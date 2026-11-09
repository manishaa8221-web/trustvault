const multer = require("multer");
const path = require("path");
const AuditLog = require("../models/AuditLog");

const allowedTypes = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 5,
  },

  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedMimeType = allowedTypes[extension];

    if (!expectedMimeType || file.mimetype !== expectedMimeType) {
      return callback(
        new Error("Only PDF, DOCX, and TXT files are allowed")
      );
    }

    callback(null, true);
  },
});

// Handle upload errors and record rejected attempts.
const uploadFile = (req, res, next) => {
  upload.single("file")(req, res, async (error) => {
    if (error) {
      try {
        if (req.user) {
          await AuditLog.create({
            user: req.user.id,
            action: "UPLOAD_REJECTED",
            details: error.message,
          });
        }
      } catch (auditError) {
        console.error("Upload audit logging failed");
      }

      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          message: "File size cannot exceed 5 MB",
        });
      }

      return res.status(400).json({
        message: error.message || "File upload failed",
      });
    }

    next();
  });
};

module.exports = uploadFile;