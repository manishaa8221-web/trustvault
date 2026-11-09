const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  grantPermission,
  revokePermission,
} = require("../controllers/permissionController");

router.post("/grant", protect, grantPermission);
router.delete("/revoke", protect, revokePermission);

module.exports = router;