const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
} = require("../controllers/adminController");

// ADMIN DASHBOARD
router.get(
  "/dashboard",
  protect,
  authorize("ADMIN"),
  getDashboardStats
);

// GET ALL REGISTERED USERS
router.get(
  "/users",
  protect,
  authorize("ADMIN"),
  getAllUsers
);

// ACTIVATE OR DEACTIVATE USER
router.patch(
  "/users/:id/status",
  protect,
  authorize("ADMIN"),
  updateUserStatus
);

module.exports = router;