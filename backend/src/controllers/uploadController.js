
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const Document = require("../models/Document");
const AuditLog = require("../models/AuditLog");

const UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

// Check the actual file contents, not just the extension.
const validateFileContent = (file) => {
  const buffer = file.buffer;
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension === ".pdf") {
    return buffer.subarray(0, 5).toString() === "%PDF-";
  }

  if (extension === ".docx") {
    const hasZipSignature =
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      [0x03, 0x05, 0x07].includes(buffer[2]) &&
      [0x04, 0x06, 0x08].includes(buffer[3]);

    const hasWordDocument = buffer.includes(
      Buffer.from("word/document.xml")
    );

    return hasZipSignature && hasWordDocument;
  }

  if (extension === ".txt") {
    if (buffer.includes(0)) {
      return false;
    }

    return Buffer.from(buffer.toString("utf8"), "utf8").equals(buffer);
  }

  return false;
};

// UPLOAD DOCUMENT
const uploadDocument = async (req, res) => {
  let savedPath;
  let createdDocument;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a file",
      });
    }

    if (!validateFileContent(req.file)) {
      await AuditLog.create({
        user: req.user.id,
        action: "UPLOAD_REJECTED",
        details: "File content did not match its claimed file type",
      });

      return res.status(400).json({
        message: "Invalid file content or unsupported file format",
      });
    }

    const title =
      typeof req.body.title === "string" && req.body.title.trim()
        ? req.body.title.trim()
        : req.file.originalname;

    const category =
      typeof req.body.category === "string" &&
      req.body.category.trim()
        ? req.body.category.trim()
        : "General";

    const extension = path.extname(req.file.originalname).toLowerCase();
    const storageName = `${crypto.randomUUID()}${extension}`;

    await fs.promises.mkdir(UPLOAD_DIR, {
      recursive: true,
    });

    savedPath = path.join(UPLOAD_DIR, storageName);

    await fs.promises.writeFile(savedPath, req.file.buffer, {
      flag: "wx",
    });

    const safeOriginalName = path
      .basename(req.file.originalname.replace(/\\/g, "/"))
      .replace(/[\x00-\x1F\x7F]/g, "")
      .slice(0, 150);

    createdDocument = await Document.create({
      title,
      content: "",
      category,
      owner: req.user.id,
      originalName: safeOriginalName,
      storageName,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });

    await AuditLog.create({
      user: req.user.id,
      document: createdDocument._id,
      action: "UPLOAD_DOCUMENT",
      details: `Uploaded ${safeOriginalName}`,
    });

    return res.status(201).json({
      message: "Document uploaded successfully",
      document: createdDocument,
    });
  } catch (error) {
    if (createdDocument) {
      await Document.findByIdAndDelete(createdDocument._id);
    }

    if (savedPath) {
      await fs.promises.unlink(savedPath).catch(() => {});
    }

    console.error("Upload error:", error.message);

    return res.status(500).json({
      message: "Could not upload document",
    });
  }
};

// DOWNLOAD DOCUMENT
// The route's READ permission middleware runs before this controller.
const downloadDocument = async (req, res) => {
  try {
    const document = req.document;

    if (!document.storageName) {
      return res.status(404).json({
        message: "This document has no uploaded file",
      });
    }

    const filePath = path.resolve(UPLOAD_DIR, document.storageName);

    // Ensure the file is inside the upload directory.
    if (path.dirname(filePath) !== UPLOAD_DIR) {
      return res.status(400).json({
        message: "Invalid file path",
      });
    }

    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch {
      return res.status(404).json({
        message: "Uploaded file not found",
      });
    }

    // Record the download after the file transfer completes successfully.
    return res.download(
      filePath,
      document.originalName || "document",
      async (error) => {
        if (error) {
          console.error("File download error:", error.message);

          if (!res.headersSent) {
            return res.status(500).json({
              message: "Could not download document",
            });
          }

          return;
        }

        try {
          await AuditLog.create({
            user: req.user.id,
            document: document._id,
            action: "DOCUMENT_DOWNLOADED",
            details: `Downloaded ${document.originalName || document.title}`,
          });
        } catch (auditError) {
          console.error(
            "Download audit logging error:",
            auditError.message
          );
        }
      }
    );
  } catch (error) {
    console.error("Download error:", error.message);

    return res.status(500).json({
      message: "Could not download document",
    });
  }
};

module.exports = {
  uploadDocument,
  downloadDocument,
};
