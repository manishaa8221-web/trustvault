
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllDocuments,
  updateDocumentAccess,
} = require("../controllers/adminController");

const {
  getAllAuditLogs,
} = require("../controllers/auditLogController");

// All admin routes require an authenticated ADMIN.
router.use(protect, authorize("ADMIN"));

// ADMIN DASHBOARD
router.get("/dashboard", getDashboardStats);

// USER MANAGEMENT
router.get("/users", getAllUsers);
router.patch("/users/:id/status", updateUserStatus);

// DOCUMENT MANAGEMENT
router.get("/documents", getAllDocuments);
router.patch("/documents/:id/access", updateDocumentAccess);

// COMPLETE SYSTEM ACTIVITY HISTORY
router.get("/audit-logs", getAllAuditLogs);

module.exports = router;
