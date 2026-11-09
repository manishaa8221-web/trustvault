
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const User = require("./models/User");

const setupAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME || "TrustVault Admin";
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env"
      );
    }

    if (password.length < 8) {
      throw new Error("Admin password must contain at least 8 characters");
    }

    await connectDB();

    const normalizedEmail = email.trim().toLowerCase();

    let admin = await User.findOne({ email: normalizedEmail });

    if (admin) {
      admin.role = "ADMIN";
      admin.isActive = true;
      await admin.save();

      console.log("Existing account successfully promoted to ADMIN.");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      admin = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      });

      console.log("Admin account created successfully!");
    }

    console.log("Admin email:", admin.email);
    console.log("Admin role:", admin.role);
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

setupAdmin();
