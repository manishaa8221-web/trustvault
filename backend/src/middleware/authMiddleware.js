
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Please login to access this resource",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication token is missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    // Always retrieve the current account from MongoDB.
    const user = await User.findById(decoded.id).select(
      "_id name email role isActive"
    );

    if (!user) {
      return res.status(401).json({
        message: "User account not found. Please login again.",
      });
    }

    // Block users whose accounts have been deactivated.
    if (user.isActive === false) {
      return res.status(403).json({
        message: "Your account is deactivated. Contact the administrator.",
      });
    }

    // Use the current database role, not the potentially outdated JWT role.
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token. Please login again.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      message: "Authentication could not be completed",
    });
  }
};

module.exports = protect;
