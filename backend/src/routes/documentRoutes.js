const express = require("express");

const router = express.Router();

const {
  createDocument,
} = require("../controllers/documentController");

router.post("/", createDocument);

module.exports = router;