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

    // DOCX is a ZIP-based format containing this entry name.
    const hasWordDocument =
      buffer.includes(Buffer.from("word/document.xml"));

    return hasZipSignature && hasWordDocument;
  }

  if (extension === ".txt") {
    // Reject binary data and invalid UTF-8 text.
    if (buffer.includes(0)) {
      return false;
    }

    return Buffer.from(buffer.toString("utf8"), "utf8").equals(buffer);
  }

  return false;
};

// Upload a document
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

    // Generate a random filename. Never use the supplied filename
    // as the physical filename on the server.
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
    // Remove incomplete database/file records if upload processing fails.
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

// Download a document after permission middleware has approved access.
const downloadDocument = async (req, res) => {
  try {
    const document = req.document;

    if (!document.storageName) {
      return res.status(404).json({
        message: "This document has no uploaded file",
      });
    }

    const filePath = path.join(UPLOAD_DIR, document.storageName);

    // Make sure the resolved file remains inside the upload directory.
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

    await AuditLog.create({
      user: req.user.id,
      document: document._id,
      action: "DOWNLOAD_DOCUMENT",
      details: `Downloaded ${document.originalName}`,
    });

    return res.download(
      filePath,
      document.originalName || "document"
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