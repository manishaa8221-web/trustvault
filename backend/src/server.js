const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const documentRoutes = require("./routes/documentRoutes");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/documents", documentRoutes);

app.get("/", (req, res) => {
  res.send("TrustVault API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});