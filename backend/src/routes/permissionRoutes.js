const express = require("express");

const router = express.Router();

const {
  grantPermission,
} = require("../controllers/permissionController");

router.post("/grant", grantPermission);

module.exports = router;