import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import xrayRoutes from "./routes/xrayRoutes.js";
import medicineScannerRoutes from "./routes/medicineScannerRoutes.js";
dotenv.config();

const app = express();

// =========================
// MIDDLEWARE
// =========================

app.use(cors());

app.use(express.json());

// Serve uploaded files
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

// =========================
// ROUTES
// =========================

app.use("/api/auth", authRoutes);

app.use("/api/patients", patientRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/xrays", xrayRoutes);
app.use("/api/medicine-scanner", medicineScannerRoutes);
// =========================
// ROOT
// =========================

app.get("/", (req, res) => {
  res.json({
    message: "MediScan AI Backend Running 🚀",
  });
});

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});