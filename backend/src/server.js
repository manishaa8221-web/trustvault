
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const documentRoutes = require("./routes/documentRoutes");
const auditRoutes = require("./routes/auditRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const adminRoutes = require("./routes/adminRoutes");

const connectDB = require("./config/db");

const app = express();

// Always allow local development and the deployed frontend.
// Also allow any additional origins configured in CLIENT_URL.
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://trustvault-lovat.vercel.app",
];

const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : [];

const allowedOrigins = [
  ...new Set([...defaultOrigins, ...configuredOrigins]),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("Blocked CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "TrustVault API is healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("TrustVault API Running");
});

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error("Server error:", error.message);

  res.status(500).json({
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`TrustVault server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

// Start only when this file is run directly.
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
