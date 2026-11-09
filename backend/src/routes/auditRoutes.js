
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getDocumentAuditLogs,
} = require("../controllers/auditController");

// Only OWNER users can view document audit logs
router.get(
  "/:id",
  protect,
  authorize("OWNER"),
  getDocumentAuditLogs
);

module.exports = router;
